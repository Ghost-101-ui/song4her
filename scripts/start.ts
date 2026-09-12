// Song4Her 🦋 — Main Startup Orchestrator
// Spawns server & web as separate subprocesses for maximum Termux/Windows stability.
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
  console.log("Let's set your admin password so you can access the dashboard:\n");

  spawnSync(npmCmd, ['run', 'setup'], {
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
console.log('  \x1b[1m\x1b[33m✔ Cloudflare Tunnel:\x1b[0m       Connecting in background...');
console.log('  \x1b[1m\x1b[35m✔ Database:\x1b[0m                Zero-native JSON engine ready');
console.log('  ─────────────────────────────────────────────────────────────────\n');
console.log('  Starting services...\n');

// ─── Health Check Helper ────────────────────────────────────────────────────

function waitForServer(
  host: string,
  port: number,
  path: string,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    function attempt() {
      if (Date.now() > deadline) {
        reject(
          new Error(
            `Server at ${host}:${port}${path} did not respond within ${timeoutMs}ms.\n` +
              'Check the [SERVER] logs above for errors.',
          ),
        );
        return;
      }

      const req = http.request({ host, port, path, method: 'GET' }, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve();
        } else {
          setTimeout(attempt, 150);
        }
      });

      req.on('error', () => setTimeout(attempt, 150));
      req.setTimeout(500, () => {
        req.destroy();
        setTimeout(attempt, 150);
      });
      req.end();
    }

    attempt();
  });
}

// ─── Find tsx binary ────────────────────────────────────────────────────────

function findTsx(): string {
  // Try local node_modules first (works in both Termux and Windows)
  const localTsx = path.join(ROOT_DIR, 'node_modules', '.bin', isWin ? 'tsx.cmd' : 'tsx');
  if (fs.existsSync(localTsx)) return localTsx;

  // Fallback: use npx tsx
  return isWin ? 'npx.cmd' : 'npx';
}

const tsxBin = findTsx();
const tsxArgs = tsxBin.endsWith('npx') || tsxBin.endsWith('npx.cmd') ? ['tsx'] : [];

// ─── Main Start ─────────────────────────────────────────────────────────────

async function start() {
  // ── Step 1: Spawn Fastify server as a subprocess ──────────────────────────
  console.log('  ⚡ Launching Fastify API server (subprocess)...');

  const serverProc = spawn(
    tsxBin,
    [...tsxArgs, path.join('apps', 'server', 'src', 'index.ts')],
    {
      stdio: 'inherit',
      cwd: ROOT_DIR,
      shell: isWin,
      env: { ...process.env },
    },
  );

  processes.push(serverProc);

  // If server exits immediately, report it as a fatal error
  let serverExited = false;
  serverProc.on('exit', (code) => {
    serverExited = true;
    if (code !== 0 && code !== null) {
      console.error(`\n\x1b[31m❌ Fastify server process exited with code ${code}.\x1b[0m`);
      console.error('   Check the [SERVER] logs above for the exact error.\n');
    }
  });

  // ── Step 2: Wait for API server to be healthy (up to 30 seconds) ──────────
  try {
    await waitForServer('127.0.0.1', 3001, '/health', 30_000);
    console.log('  \x1b[32m✔ Fastify API server ready on http://127.0.0.1:3001!\x1b[0m\n');
  } catch (err: any) {
    console.error(`\n\x1b[31m❌ ${err.message}\x1b[0m`);
    if (serverExited) {
      console.error(
        '\x1b[33m   Tip: if you see EADDRINUSE, run:\x1b[0m\n' +
          '     pkill -f "tsx" && pkill -f "node"    (Termux/Linux)\n' +
          '     taskkill /f /im node.exe             (Windows)\n',
      );
    }
    cleanup();
    return;
  }

  // ── Step 3: Spawn Next.js Web App ─────────────────────────────────────────
  const nextBin = path.join(ROOT_DIR, 'node_modules', 'next', 'dist', 'bin', 'next');
  const webDir = path.join(ROOT_DIR, 'apps', 'web');
  const hasNextBuild = fs.existsSync(path.join(webDir, '.next', 'BUILD_ID'));
  const webCmd = hasNextBuild ? 'start' : 'dev';

  if (hasNextBuild) {
    console.log('  ⚡ Launching Next.js (production mode — instant start)...');
  } else {
    console.log('  ⚡ Launching Next.js (development mode)...');
  }

  const webProc = fs.existsSync(nextBin)
    ? spawn(process.execPath, [nextBin, webCmd, '--port', '3000'], {
        stdio: 'inherit',
        cwd: webDir,
        env: { ...process.env, PORT: '3000' },
      })
    : spawn(npmCmd, ['run', webCmd, '--workspace=apps/web'], {
        stdio: 'inherit',
        cwd: ROOT_DIR,
        shell: true,
        env: { ...process.env, PORT: '3000' },
      });

  processes.push(webProc);

  // ── Step 4: Auto-open browser after 4s ────────────────────────────────────
  setTimeout(() => {
    const url = 'http://localhost:3000/admin';
    try {
      if (isWin) {
        spawn('cmd.exe', ['/c', 'start', url], { detached: true, stdio: 'ignore' });
      } else if (isMac) {
        spawn('open', [url], { detached: true, stdio: 'ignore' });
      }
      // On Termux/Linux we skip xdg-open (not typically available)
    } catch {
      // Ignore if auto-open is unsupported
    }
  }, 4000);
}

start().catch((err) => {
  console.error('\x1b[31m❌ Fatal startup error:\x1b[0m', err?.message || err);
  process.exit(1);
});
