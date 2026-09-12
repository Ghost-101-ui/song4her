# 💻 Song4Her 🦋 — Laptop / PC Setup Guide (Windows, macOS, Linux)

This guide walks you through setting up **Song4Her** on your personal laptop or desktop computer at **₹0 cost**.

---

## 📋 Prerequisites

1. **Node.js (v18.0+ or v20+ LTS recommended)**:
   - Check version: `node -v`
   - Download from: [https://nodejs.org](https://nodejs.org)
2. **FFmpeg** (for audio metadata extraction, waveform generation, & tag reading):
   - **Windows**: Install via winget: `winget install Gyan.FFmpeg` or download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)
   - **macOS**: `brew install ffmpeg`
   - **Linux (Ubuntu/Debian)**: `sudo apt update && sudo apt install -y ffmpeg`
3. **Cloudflare Tunnel (`cloudflared`)** (for free public HTTPS URLs):
   - **Windows**: `winget install Cloudflare.cloudflared` or download `cloudflared.exe` from [Cloudflare Releases](https://github.com/cloudflare/cloudflared/releases)
   - **macOS**: `brew install cloudflared`
   - **Linux**: `sudo apt install cloudflared` or download deb/rpm package

---

## 🚀 Quick Setup (Under 3 Minutes)

### 1. Clone or Open the Repository
```bash
cd song4her
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Your Admin Password
```bash
npm run setup
```
Follow the interactive prompt to set your password. This securely writes a salted `scrypt` hash into `.env`.

### 5. Launch Song4Her 🦋
```bash
npm run song4her
```

---

## 📱 How to Use Song4Her

1. **Open Dashboard**:
   Visit [http://localhost:3000/admin](http://localhost:3000/admin) in your browser.
2. **Log In**:
   Enter the password you created during `npm run setup`.
3. **Send a Song ("Quick Send")**:
   - Select or drag an authorized audio file (`.mp3`, `.m4a`, `.flac`, `.wav`, etc.).
   - Song4Her automatically extracts the ID3 Title, Artist, Album, and Cover Art!
   - Write a personal note for her (or pick one of the quick templates).
   - Choose expiry (Never, 24h, 3d, 7d).
   - Click **Create & Generate Share Link**.
4. **Share on WhatsApp**:
   - Click **WhatsApp** in the share modal, or copy the link.
   - Send the link to her!
5. **Her Experience**:
   - She clicks the link on her phone.
   - She sees the spinning vinyl artwork, glowing ambient background, your personal note, an in-browser audio player, and a high-speed direct download button.
6. **After Download**:
   - Your dashboard updates in real-time showing the download count.
   - You can press `Ctrl + C` in your terminal to shut down the server whenever you're done!
