import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';

const base = process.env.VERIFY_URL || 'http://127.0.0.1:4173';
const request = (pathname, headers = {}, method = 'GET') => new Promise((resolve, reject) => {
  const req = http.request(new URL(pathname, base), { method, headers }, res => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    res.on('error', reject);
  });
  req.on('error', reject);
  req.end();
});

for (const file of ['index.html', 'app.js', 'styles.css', 'quiz/quiz.js', 'quiz/quiz.css']) {
  const original = await readFile(`dist/client/${file}`);
  const plain = await request(`/${file}`);
  assert.equal(plain.status, 200);
  assert.deepEqual(plain.body, original);
  for (const encoding of ['br', 'gzip']) {
    const compressed = await request(`/${file}`, { 'Accept-Encoding': encoding });
    assert.equal(compressed.status, 200);
    assert.equal(compressed.headers['content-encoding'], encoding);
    assert.equal(compressed.headers.vary, 'Accept-Encoding');
    assert(compressed.body.length < original.length);
    assert.deepEqual((encoding === 'br' ? brotliDecompressSync : gunzipSync)(compressed.body), original);
    const cached = await request(`/${file}`, { 'Accept-Encoding': encoding, 'If-None-Match': compressed.headers.etag });
    assert.equal(cached.status, 304);
    assert.equal(cached.body.length, 0);
    assert.notEqual(plain.headers.etag, compressed.headers.etag);
  }
  const head = await request(`/${file}`, {}, 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(Number(head.headers['content-length']), original.length);
  assert.equal(head.body.length, 0);
}
assert.equal((await request('/app.js', { 'Accept-Encoding': 'br;q=0,gzip;q=1' })).headers['content-encoding'], 'gzip');
assert.equal((await request('/app.js', { 'Accept-Encoding': 'br;q=0,gzip;q=0' })).headers['content-encoding'], undefined);
assert.equal((await request('/missing-file.js')).status, 404);

for (const name of ['jessica', 'maykon', 'remedios']) {
  const file = `assets/testimonials/${name}.mp4`;
  const bytes = await readFile(`dist/client/${file}`);
  const size = (await stat(`dist/client/${file}`)).size;
  const first = await request(`/${file}`, { Range: 'bytes=0-127' });
  assert.equal(first.status, 206);
  assert.equal(first.headers['content-range'], `bytes 0-127/${size}`);
  assert.deepEqual(first.body, bytes.subarray(0, 128));
  const last = await request(`/${file}`, { Range: 'bytes=-128' });
  assert.equal(last.status, 206);
  assert.deepEqual(last.body, bytes.subarray(-128));
  const seek = await request(`/${file}`, { Range: `bytes=${size - 256}-` });
  assert.equal(seek.status, 206);
  assert.deepEqual(seek.body, bytes.subarray(-256));
  const invalid = await request(`/${file}`, { Range: `bytes=${size}-` });
  assert.equal(invalid.status, 416);
  assert.equal(invalid.headers['content-range'], `bytes */${size}`);
}
console.log('Entrega OK: Brotli/gzip sem alteração de conteúdo, cache 304, HEAD e reprodução/seek por ranges nos três vídeos.');
