# Song4Her 🦋

> *A private, personalized song-delivery web application — built with love.*

```
You receive a song request
  → Run Song4Her on your laptop (Windows/Mac/Linux) or Android phone (Termux)
  → Upload any authorized audio file
  → Song4Her creates a beautiful personalized share page
  → Send the public HTTPS link via WhatsApp
  → She opens it: sees album art, vinyl animation, your personal note, audio preview & download button
  → 🎊 Party popper confetti when she downloads
  → After download, shut down the server. Done.
```

**₹0 cost. No cloud. No subscriptions. Just your laptop or phone.**

---

## ✨ Features

- 🦋 **Stunning recipient page** — spinning vinyl, dynamic artwork glow, glassmorphism card
- 🎵 **In-browser audio preview** — play before downloading, interactive scrubber
- 💌 **Personal note** — your heartfelt message in an elegant card
- 🎊 **Party popper confetti** — celebrates when she downloads the song
- 🔗 **Free HTTPS tunnel** — `cloudflared` creates a public `https://*.trycloudflare.com` link instantly
- ⚡ **Quick Send** — drag & drop audio, auto-extracts ID3 tags (title, artist, album, artwork) via FFmpeg
- 📱 **WhatsApp 1-click share** — formatted message + QR code
- 🔴 **Live dashboard** — real-time download notifications via Socket.IO
- 📱 **Runs on Android (Termux)** — zero C++ build tools needed

---

## 🖥️ Installation — Windows / macOS / Linux (CMD / Terminal)

### Prerequisites

| Tool | Install |
|------|---------|
| **Node.js** ≥ 18 | [nodejs.org](https://nodejs.org) |
| **FFmpeg** | [ffmpeg.org/download](https://ffmpeg.org/download.html) or `choco install ffmpeg` / `brew install ffmpeg` |
| **Git** | [git-scm.com](https://git-scm.com) |

### Step 1 — Clone the repo

```cmd
git clone https://github.com/Ghost-101-ui/song4her.git
cd song4her
```

### Step 2 — Install dependencies

```cmd
npm install
```

### Step 3 — Download cloudflared (free HTTPS tunnel)

**Windows:**
```cmd
mkdir bin
curl -L -o bin/cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
```

**macOS:**
```bash
mkdir -p bin
curl -L -o bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64
chmod +x bin/cloudflared
```

**Linux (x64):**
```bash
mkdir -p bin
curl -L -o bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x bin/cloudflared
```

### Step 4 — One-click launch 🚀

**Windows** — double-click `run.bat` in File Explorer, OR run in CMD:
```cmd
run.bat
```

**macOS / Linux:**
```bash
chmod +x run.sh
./run.sh
```

> On first launch, it will ask you to set your admin password. After that, it's fully automatic.

### Step 5 — Open the dashboard

```
http://localhost:3000/admin
```

Log in → drag & drop a song → add a note → hit **Quick Send** → copy the WhatsApp link → send it! 🦋

---

## 📱 Installation — Android (Termux)

> Run Song4Her right from your phone. No laptop needed.

### Step 1 — Install Termux

> ⚠️ Do **NOT** install from Google Play — it's outdated.

Install from **F-Droid**: [f-droid.org/packages/com.termux](https://f-droid.org/packages/com.termux/)

Or download the APK directly from [Termux GitHub Releases](https://github.com/termux/termux-app/releases).

### Step 2 — Install packages

Open Termux and run:

```bash
pkg update && pkg upgrade -y
pkg install -y nodejs-lts git ffmpeg openssl
```

Grant storage access (to upload music files from your phone):
```bash
termux-setup-storage
```
Tap **Allow** when prompted.

### Step 3 — Install cloudflared for ARM

```bash
# Detect your phone's architecture (most modern phones are aarch64)
ARCH=$(dpkg --print-architecture)
if [ "$ARCH" = "aarch64" ]; then
  curl -L -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
else
  curl -L -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm
fi
chmod +x cloudflared
mv cloudflared $PREFIX/bin/
```

Verify:
```bash
cloudflared --version
```

### Step 4 — Clone & setup

```bash
git clone https://github.com/Ghost-101-ui/song4her.git
cd song4her
npm install
```

### Step 5 — Run 🚀

```bash
npm run song4her
```

On first run it will prompt you to set an admin password.

Then open your phone's browser and go to:
```
http://localhost:3000/admin
```

Log in → pick a song from `/sdcard/Music/` → add a personal note → **Quick Send** → share the link on WhatsApp! 🦋

### Termux Battery Tip

To prevent Android from killing the server while she's downloading:
1. Long-press Termux in app drawer → **App info → Battery → Unrestricted**
2. In Termux notification, tap **Acquire Wakelock**

---

## 🛠️ All npm Commands

| Command | What it does |
|---------|-------------|
| `npm run song4her` | 🚀 Start everything (1-click) |
| `npm run setup` | Set / change admin password |
| `npm run db:push` | Initialize / reset SQLite database |
| `npm run db:studio` | Open Prisma Studio (database viewer) |
| `npm run dev` | Start web + server in dev mode (with concurrently) |
| `npm run build` | Build all packages for production |

---

## 🏗️ Architecture

```
song4her/
├── apps/
│   ├── web/           # Next.js 15 (App Router, Tailwind, Socket.IO client)
│   └── server/        # Fastify v5 (API, streaming, FFmpeg, cloudflared tunnel)
├── packages/
│   ├── database/      # Prisma ORM + SQLite
│   ├── types/         # Shared TypeScript interfaces
│   └── shared/        # Formatting & slug utilities
├── data/              # 🔒 Local — songs, artwork, SQLite DB (gitignored)
├── bin/               # 🔒 Local — cloudflared binary (gitignored)
├── scripts/           # start.ts, setup-password.ts
├── docs/              # Detailed guides
├── run.bat            # Windows 1-click launcher
└── run.sh             # Unix/Termux 1-click launcher
```

**Tech stack:**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide icons
- **Backend**: Node.js, Fastify v5, Socket.IO v4
- **Database**: SQLite via Prisma ORM
- **Media**: FFmpeg (fluent-ffmpeg), Sharp
- **Tunnel**: Cloudflare Quick Tunnels (`cloudflared`)
- **Auth**: Node.js `scrypt` salted hashing, secure `@fastify/session` cookies

---

## 📖 More Docs

- [Laptop / Desktop Setup (detailed)](./docs/INSTALL_LAPTOP.md)
- [Android Termux Setup (detailed)](./docs/INSTALL_TERMUX.md)
- [Troubleshooting & FAQ](./docs/TROUBLESHOOTING.md)

---

## 🫶🏻 Made by

*Built with 🫶🏻 by Dhurbb — for her shiuuuu 🦋*
