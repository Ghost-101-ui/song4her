# 📱 Song4Her 🦋 — Android Termux Setup Guide

Run Song4Her directly on your Android phone using **Termux** at **₹0 cost**!

---

## 📋 Step 1: Install Termux & Termux:API

1. Do **NOT** install Termux from Google Play Store (it is outdated).
2. Install the latest Termux from **F-Droid** or [Termux GitHub Releases](https://github.com/termux/termux-app/releases).
3. Optional: Install **Termux:API** from F-Droid for clipboard & share integration.

---

## 🛠️ Step 2: Install Packages in Termux

Open Termux and run:

```bash
pkg update && pkg upgrade -y
pkg install -y nodejs-lts git ffmpeg openssl
```

### Storage Permission (Access your music files)
```bash
termux-setup-storage
```
*Tap "Allow" on your phone prompt.*

---

## ☁️ Step 3: Install Cloudflare Tunnel (`cloudflared`)

Cloudflare provides a lightweight ARM/ARM64 binary that runs smoothly in Termux:

```bash
# Detect architecture (usually aarch64 on modern phones)
ARCH=$(dpkg --print-architecture)
if [ "$ARCH" = "aarch64" ]; then
  curl -L --output cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
else
  curl -L --output cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm
fi

chmod +x cloudflared
mv cloudflared $PREFIX/bin/
```

Verify installation:
```bash
cloudflared --version
```

---

## 🚀 Step 4: Clone and Setup Song4Her

```bash
git clone <your-repo-or-copy-folder> song4her
cd song4her

# Install dependencies
npm install

# Initialize local SQLite database
npm run db:push

# Set your admin password
npm run setup
```

---

## 🦋 Step 5: Run Song4Her

```bash
npm run song4her
```

1. Open Chrome or any browser on your phone and go to:
   [http://localhost:3000/admin](http://localhost:3000/admin)
2. Log in with your password.
3. Select any audio file from your phone storage (`/sdcard/Music/` or Downloads).
4. Tap **Quick Send**, add a personal note, and tap **WhatsApp Share**!
5. When she finishes downloading, just exit Termux or press `Ctrl + C`.

---

## 💡 Termux Battery Optimization Tip

To prevent Android from killing Termux in the background while she downloads:
1. Long-press Termux app icon → **App info** → **Battery** → Select **Unrestricted**.
2. In Termux, pull down notification shade and tap **Acquire Wakelock** (or run `termux-wake-lock`).
