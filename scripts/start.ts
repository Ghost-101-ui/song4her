// Song4Her 🦋 — Main Startup Orchestrator
import { spawn, spawnSync, type ChildProcess } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';

const ROOT_DIR = process.cwd();
const DATA_DIRS = [
  path.join(ROOT_DIR, 'data'),
  path.join(ROOT_DIR, 'data', 'database'),
  path.join(ROOT_DIR, 'data', 'songs'),
  path.join(ROOT_DIR, 'data', 'artwork'),
  path.join(ROOT_DIR, 'data', 'temp'),
];

// 1. Ensure runtime directories exist
for (const dir of DATA_DIRS) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 2. Ensure .env exists
const envPath = path.join(ROOT_DIR, '.env');
const envExamplePath = path.join(ROOT_DIR, '.env.example');
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('📄 Created .env from .env.example');
}

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// 3. First-run check: verify if ADMIN_PASSWORD_HASH is set
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const hasPasswordHash = /^ADMIN_PASSWORD_HASH=.+:\S+/m.test(envContent);

if (!hasPasswordHash) {
  console.log('\n🦋 Welcome to Song4Her! First-time setup detected.');
  console.log('Let\'s set your admin password so you can access the dashboard:\n');

  spawnSync(npmCmd, ['run', 'setup'], {
    stdio: 'inherit',
    cwd: ROOT_DIR,
    shell: true,
  });
}

// 4. Ensure SQLite database file exists
const dbPath = path.join(ROOT_DIR, 'data', 'database', 'song4her.db');
if (!fs.existsSync(dbPath)) {
  console.log('\n📦 Initializing local SQLite database...');
  spawnSync(npmCmd, ['run', 'db:push'], {
    stdio: 'inherit',
    cwd: ROOT_DIR,
    shell: true,
  });
}

const processes: ChildProcess[] = [];

function cleanup() {
  console.log('\n\n🦋 Shutting down Song4Her gracefully...');
  for (const p of processes) {
    try {
      if (process.platform === 'win32') {
        if (p.pid) spawn('taskkill', ['/pid', p.pid.toString(), '/f', '/t']);
      } else {
        p.kill('SIGTERM');
      }
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

console.clear();
console.log('\x1b[35m' + `
  ███████╗ ██████╗ ███╗   ██╗ ██████╗ ██╗  ██╗██╗  ██╗███████╗██████╗ 
  ██╔════╝██╔═══██╗████╗  ██║██╔════╝ ██║  ██║██║  ██║██╔════╝██╔══██╗
  ███████╗██║   ██║██╔██╗ ██║██║  ███╗███████║███████║█████╗  ██████╔╝
  ╚════██║██║   ██║██║╚██╗██║██║   ██║╚════██║██╔══██║██╔══╝  ██╔══██╗
  ███████║╚██████╔╝██║ ╚████║╚██████╔╝     ██║██║  ██║███████╗██║  ██║
  ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝      ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
` + '\x1b[0m');
console.log('\x1b[36m' + '  🦋 A private, personalized song-delivery platform for her shiuuuu 🫶🏻' + '\x1b[0m\n');
console.log('  ─────────────────────────────────────────────────────────────────');
console.log('  \x1b[1m\x1b[32m✔ Local Admin Dashboard:\x1b[0m   http://localhost:3000/admin');
console.log('  \x1b[1m\x1b[34m✔ Fastify API Server:\x1b[0m      http://localhost:3001');
console.log('  \x1b[1m\x1b[33m✔ Cloudflare Tunnel:\x1b[0m       Starting automatically...');
console.log('  ─────────────────────────────────────────────────────────────────\n');
console.log('  Starting services...\n');

async function start() {
  // 5. Start Server
  console.log('  ⚡ Launching Fastify API server...');
  const serverProc = spawn(npmCmd, ['run', 'dev', '--workspace=apps/server'], {
    stdio: 'inherit',
    cwd: ROOT_DIR,
    shell: true,
    env: { ...process.env },
  });
  processes.push(serverProc);

  function checkServerHealth(port: number = 3001): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(800, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async function waitForServer(port: number = 3001, timeoutMs: number = 20000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await checkServerHealth(port)) return true;
      await new Promise((r) => setTimeout(r, 250));
    }
    return false;
  }

  // 6. Wait for Fastify API to be listening and healthy before launching Next.js
  console.log('  ⏳ Waiting for API server on port 3001...');
  const isReady = await waitForServer(3001, 20000);
  if (isReady) {
    console.log('  \x1b[32m✔ API server is ready!\x1b[0m\n');
  } else {
    console.warn('  \x1b[33m⚠ API server took longer than expected to start, launching web...\x1b[0m\n');
  }

  // 7. Start Web
  console.log('  ⚡ Launching Next.js web application...');
  const webProc = spawn(npmCmd, ['run', 'dev', '--workspace=apps/web'], {
    stdio: 'inherit',
    cwd: ROOT_DIR,
    shell: true,
    env: { ...process.env },
  });
  processes.push(webProc);

  // 8. Automatically open browser after web is ready
  setTimeout(() => {
    const url = 'http://localhost:3000/admin';
    try {
      if (isWin) {
        spawn('cmd.exe', ['/c', 'start', url], { detached: true, stdio: 'ignore' });
      } else if (isMac) {
        spawn('open', [url], { detached: true, stdio: 'ignore' });
      } else {
        spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
      }
    } catch {
      // Ignore if auto-open is unsupported in current terminal
    }
  }, 4000);
}

start().catch(console.error);
