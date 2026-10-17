const esbuild = require('esbuild');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

let electronProcess = null;

function waitForVite(url, callback) {
  const req = http.get(url, (res) => {
    callback();
  });
  req.on('error', () => {
    setTimeout(() => waitForVite(url, callback), 300);
  });
}

async function start() {
  console.log('Compiling Electron scripts...');
  const ctx = await esbuild.context({
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

  await ctx.rebuild();

  const srcScripts = path.join(__dirname, 'electron', 'scripts');
  const destScripts = path.join(__dirname, 'dist-electron', 'scripts');
  if (fs.existsSync(srcScripts)) {
    fs.cpSync(srcScripts, destScripts, { recursive: true, force: true });
  }

  console.log('Electron scripts compiled as .cjs. Waiting for Vite dev server...');

  waitForVite('http://localhost:5173', () => {
    console.log('Vite server ready. Launching Electron...');
    const electronBin = require('electron');
    electronProcess = spawn(electronBin, ['.'], {
      stdio: 'inherit',
      env: { ...process.env, VITE_DEV_SERVER_URL: 'http://localhost:5173' },
    });

    electronProcess.on('close', () => {
      process.exit(0);
    });
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
