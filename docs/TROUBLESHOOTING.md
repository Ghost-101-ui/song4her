# 🔧 Song4Her 🦋 — Troubleshooting Guide

Common issues and quick solutions when running Song4Her on laptop or Android Termux.

---

## 1. Cloudflare Tunnel Not Connecting

**Symptoms:** Status bar shows "Tunnel not connected" or URL is `localhost:3000`.

**Solutions:**
1. Check if `cloudflared` is installed and in your system PATH:
   ```bash
   cloudflared --version
   ```
2. If using a firewall or restrictive WiFi (e.g. college/office network), Quick Tunnels may be blocked on port 7844 (UDP). Test with mobile hotspot or run:
   ```bash
   cloudflared tunnel --url http://localhost:3000 --protocol http2
   ```
3. You can click **Restart Tunnel** in the admin dashboard status bar or in Settings.

---

## 2. FFmpeg Not Found

**Symptoms:** Creating deliveries works, but ID3 metadata (duration, album, title) is not auto-extracted.

**Solutions:**
- **Windows**: Install with `winget install Gyan.FFmpeg` and reopen your terminal.
- **Mac**: `brew install ffmpeg`
- **Linux/Termux**: `pkg install ffmpeg` (or `sudo apt install ffmpeg`).
- Manual entry is always supported if FFmpeg is unavailable!

---

## 3. Database Errors (`PrismaClientInitializationError`)

**Symptoms:** Error opening SQLite database or missing table.

**Solutions:**
1. Make sure `data/database/` directory exists:
   ```bash
   mkdir -p data/database
   ```
2. Re-apply schema:
   ```bash
   npm run db:push
   ```
3. Generate client:
   ```bash
   npm run db:generate
   ```

---

## 4. Reset Admin Password

If you forgot your password:
```bash
npm run setup
```
This overwrites `ADMIN_PASSWORD_HASH` in `.env` with a fresh hash immediately.

---

## 5. Port Already in Use (3000 or 3001)

If previous processes weren't cleanly closed:
- **Windows**:
  ```powershell
  Get-Process -Name node | Stop-Process
  ```
- **macOS / Linux / Termux**:
  ```bash
  killall node
  ```
- Or customize ports in `.env`:
  ```env
  PORT=3002
  WEB_PORT=3000
  ```
