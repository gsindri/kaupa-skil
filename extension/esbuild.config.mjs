import { build } from 'esbuild';
import { cp } from 'fs/promises';
import path from 'path';

const outdir = 'dist';

await build({
  entryPoints: ['background/service-worker.ts'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  outdir: path.join(outdir, 'background'),
  entryNames: 'service-worker'
});

for (const entry of ['content/vendor-capture.ts', 'content/inject-fetch-hook.ts', 'content/app-bridge.ts']) {
  await build({
    entryPoints: [entry],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    outdir: path.join(outdir, path.dirname(entry)),
    entryNames: path.basename(entry, '.ts')
  });
}

await cp('manifest.json', path.join(outdir, 'manifest.json'));
await cp('assets', path.join(outdir, 'assets'), { recursive: true });
await cp('diagnostics', path.join(outdir, 'diagnostics'), { recursive: true });

console.log('build complete');

