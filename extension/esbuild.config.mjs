import { build } from 'esbuild';
import { cp } from 'fs/promises';
import path from 'path';

const entryPoints = [
  'background/service-worker.ts',
  'content/vendor-capture.ts',
  'content/inject-fetch-hook.ts',
  'content/app-bridge.ts'
];

const outdir = 'dist';

for (const entry of entryPoints) {
  await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    outdir: path.join(outdir, path.dirname(entry)),
    entryNames: path.basename(entry, '.ts')
  });
}

await cp('manifest.json', path.join(outdir, 'manifest.json'));
await cp('assets', path.join(outdir, 'assets'), { recursive: true });

console.log('build complete');
