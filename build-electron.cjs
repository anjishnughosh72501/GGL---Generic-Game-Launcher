const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  console.log('Building Electron main and preload scripts...');
  await esbuild.build({
    entryPoints: ['electron/main.ts', 'electron/preload.ts'],
    outdir: 'dist-electron',
    outExtension: { '.js': '.cjs' },
    bundle: true,
    platform: 'node',
    target: 'node20',
    external: ['electron'],
    format: 'cjs',
    sourcemap: true,
  });

  const srcScripts = path.join(__dirname, 'electron', 'scripts');
  const destScripts = path.join(__dirname, 'dist-electron', 'scripts');
  if (fs.existsSync(srcScripts)) {
    fs.cpSync(srcScripts, destScripts, { recursive: true, force: true });
  }

  console.log('Electron scripts built successfully as CommonJS (.cjs).');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
