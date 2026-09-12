// Song4Her 🦋 — Post-install cleanup
// Ensures zero-native dependencies (removes Prisma/sharp if accidentally installed).
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const BAD_PACKAGES = ['@prisma/client', 'prisma', '.prisma', 'sharp'];

let removedAny = false;
for (const pkg of BAD_PACKAGES) {
  const pkgPath = join(ROOT, 'node_modules', pkg);
  if (existsSync(pkgPath)) {
    rmSync(pkgPath, { recursive: true, force: true });
    console.log(`[song4her] ✓ Removed incompatible native package: ${pkg}`);
    removedAny = true;
  }
}

if (!removedAny) {
  console.log('[song4her] ✓ No native/incompatible packages found — clean install!');
}
