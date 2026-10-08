import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import worker from '../src/worker.js';
try { process.loadEnvFile(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const root = path.resolve('dist/client');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };

function preferredEncodings(header = '') {
  const accepted = new Map(header.toLowerCase().split(',').map(part => {
    const [name, ...parameters] = part.trim().split(';');
    const quality = parameters.find(p => p.trim().startsWith('q='));
    return [name, quality ? Number(quality.trim().slice(2)) : 1];
  }));
  return ['br', 'gzip'].map(name => ({ name, quality: accepted.get(name) ?? accepted.get('*') ?? 0 }))
    .filter(item => item.quality > 0 && item.quality <= 1)
    .sort((a, b) => b.quality - a.quality).map(item => item.name);
}

function byteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!match || (!match[1] && !match[2])) return null; // Ignore unsupported/malformed ranges.
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] ? (match[2] ? Math.min(Number(match[2]), size - 1) : size - 1) : size - 1;
  return start >= size || end < start ? false : { start, end };
}
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);
    if (url.pathname.startsWith('/api/')) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const response = await worker.fetch(new Request(url, { method: req.method, headers: req.headers, ...(req.method === 'POST' ? { body: Buffer.concat(chunks) } : {}) }), process.env);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname) + (url.pathname.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    let servedFile = file;
    let info = await stat(file);
    if (!info.isFile()) { res.writeHead(404); res.end('Não encontrado'); return; }
    const compressible = /\.(html|css|js|svg)$/.test(file);
    if (compressible) {
      res.setHeader('Vary', 'Accept-Encoding');
      if (!req.headers.range) for (const encoding of preferredEncodings(req.headers['accept-encoding'])) {
        const candidate = `${file}.${encoding === 'gzip' ? 'gz' : 'br'}`;
        try {
          const compressedInfo = await stat(candidate);
          servedFile = candidate;
          info = compressedInfo;
          res.setHeader('Content-Encoding', encoding);
          break;
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
    }
    const etag = `W/"${info.size.toString(16)}-${info.mtimeMs.toString(16)}-${res.getHeader('Content-Encoding') || 'identity'}"`;
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, no-cache');
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', info.mtime.toUTCString());
    const matchesTag = req.headers['if-none-match']?.split(',').some(tag => tag.trim() === etag || tag.trim() === '*' || `W/${tag.trim()}` === etag);
    const unchangedSince = !req.headers['if-none-match'] && req.headers['if-modified-since'] && Math.floor(info.mtimeMs / 1000) * 1000 <= Date.parse(req.headers['if-modified-since']);
    if ((req.method === 'GET' || req.method === 'HEAD') && (matchesTag || unchangedSince)) {
      res.writeHead(304); res.end(); return;
    }
    res.setHeader('Accept-Ranges', 'bytes');
    // Weak ETags cannot validate If-Range; dates can. A mismatch sends the full file.
    const ifRange = req.headers['if-range'];
    const range = req.method === 'GET' && (!ifRange || ifRange === info.mtime.toUTCString()) ? byteRange(req.headers.range, info.size) : null;
    if (range === false) {
      res.setHeader('Content-Range', `bytes */${info.size}`);
      res.writeHead(416); res.end(); return;
    }
    if (range) {
      res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${info.size}`);
      res.setHeader('Content-Length', range.end - range.start + 1);
      res.writeHead(206);
    } else res.setHeader('Content-Length', info.size);
    if (req.method === 'HEAD') { res.end(); return; }
    await pipeline(createReadStream(servedFile, range || {}), res);
  } catch (error) {
    if (res.headersSent || res.destroyed) { res.destroy(); return; }
    res.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500);
    res.end('Não encontrado');
  }
}).listen(port, host, () => console.log(`http://${host}:${port}`));
