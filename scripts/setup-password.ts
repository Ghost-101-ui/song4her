// Song4Her 🦋 — Password Setup CLI
import readline from 'readline';
import { randomBytes, scryptSync } from 'crypto';
import fs from 'fs';
import path from 'path';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n🦋 Song4Her — Admin Password Setup\n');
console.log('This will generate a secure scrypt password hash and write it to your .env file.\n');

rl.question('Enter new admin password: ', (password: string) => {
  if (!password || password.trim().length < 4) {
    console.error('\n❌ Password must be at least 4 characters long.');
    rl.close();
    process.exit(1);
  }

  const hash = hashPassword(password.trim());
  const envPath = path.resolve(process.cwd(), '.env');
  const envExamplePath = path.resolve(process.cwd(), '.env.example');

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf-8');
  }

  // Update or append ADMIN_PASSWORD_HASH
  if (envContent.includes('ADMIN_PASSWORD_HASH=')) {
    envContent = envContent.replace(
      /ADMIN_PASSWORD_HASH=.*/,
      `ADMIN_PASSWORD_HASH="${hash}"`
    );
  } else {
    envContent += `\nADMIN_PASSWORD_HASH="${hash}"\n`;
  }

  // Also ensure SESSION_SECRET exists
  if (!envContent.includes('SESSION_SECRET=') || envContent.includes('SESSION_SECRET="change-this-to-a-random-secret"')) {
    const sessionSecret = randomBytes(32).toString('hex');
    envContent = envContent.replace(
      /SESSION_SECRET=.*/,
      `SESSION_SECRET="${sessionSecret}"`
    );
  }

  fs.writeFileSync(envPath, envContent, 'utf-8');

  console.log('\n✅ Password hash successfully updated in .env!');
  console.log(`\nGenerated Hash: ${hash.slice(0, 16)}...`);
  console.log('\nYou can now start Song4Her:');
  console.log('  npm run song4her\n');

  rl.close();
});
