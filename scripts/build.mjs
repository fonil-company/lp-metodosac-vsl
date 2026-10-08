import { build, transform } from 'esbuild';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { brotliCompress, gzip, constants } from 'node:zlib';
import path from 'node:path';
await mkdir('dist/client/quiz', { recursive: true });
await mkdir('dist/server', { recursive: true });
await cp('public', 'dist/client', { recursive: true });
for (const [file, loader] of [['app.js', 'js'], ['styles.css', 'css'], ['quiz-shell.css', 'css']]) {
  const result = await transform(await readFile(`public/${file}`, 'utf8'), { loader, minify: true });
  await writeFile(`dist/client/${file}`, result.code);
}
await build({ entryPoints: ['src/quiz-entry.tsx'], outfile: 'dist/client/quiz/quiz.js', bundle: true, minify: true, jsx: 'automatic', alias: { '@': './src' }, define: { 'process.env.NODE_ENV': '"production"' } });
const css = spawnSync(process.execPath, ['node_modules/@tailwindcss/cli/dist/index.mjs', '-i', 'src/quiz.css', '-o', 'dist/client/quiz/quiz.css', '--minify'], { stdio: 'inherit' });
if (css.status !== 0) process.exit(css.status || 1);
await cp('src/worker.js', 'dist/server/index.js');
await writeFile('dist/server/wrangler.json', JSON.stringify({ name: 'metodo-sac-vsl', main: 'index.js', compatibility_date: '2026-10-01', assets: { directory: '../client', binding: 'ASSETS', run_worker_first: ['/api/*'] } }, null, 2));

// Precompress text once at build time; media is already compressed.
async function compressDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await compressDirectory(file);
    else if (/\.(html|css|js|svg)$/.test(entry.name)) {
      const data = await readFile(file);
      const [br, gz] = await Promise.all([
        promisify(brotliCompress)(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }),
        promisify(gzip)(data, { level: 9 }),
      ]);
      await Promise.all([writeFile(`${file}.br`, br), writeFile(`${file}.gz`, gz)]);
    }
  }
}
await compressDirectory('dist/client');
