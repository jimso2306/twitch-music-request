# 🎵 Twitch Music Request

A self-hosted Twitch song request system with Discord-based moderation. Viewers request songs via chat, streamers approve/reject from Discord, and music plays automatically via mpv.

![Twitch](https://img.shields.io/badge/Platform-Twitch-9147ff?style=flat-square&logo=twitch)
![Discord](https://img.shields.io/badge/Control-Discord-5865F2?style=flat-square&logo=discord)
![YouTube](https://img.shields.io/badge/Player-YouTube-FF0000?style=flat-square&logo=youtube)

## ✨ Features

- 🎤 **Chat command**: Viewers request music with `!music <title or link>`
- 📱 **Discord approval**: Receive requests on Discord with Approve/Reject buttons
- 🎬 **Auto playback**: Approved songs play automatically via mpv (no browser needed)
- 🔍 **Auto search**: Viewers can type just the song name
- 🎨 **OBS overlay**: Display "Now Playing" on your stream
- 📱 **Web control**: Manage queue from your phone/tablet

## 🚀 Installation

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [mpv](https://mpv.io/installation/) (media player)
- A Discord account
- A Twitch channel

### 2. Install mpv

**Windows (PowerShell as admin):**
```
winget install mpv
```

**Or download manually:** https://mpv.io/installation/

### 3. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** → name it → Create
3. Go to **"Bot"** → **"Reset Token"** → copy the token
4. Enable **"Message Content Intent"**
5. Go to **"OAuth2"** → **"URL Generator"**
   - Check `bot` and `applications.commands`
   - Permissions: `Send Messages`, `Embed Links`
   - Copy the URL and invite the bot to your server
6. Right-click on your Discord channel → "Copy Channel ID"

### 4. Setup

```bash
git clone https://github.com/YOUR_USERNAME/twitch-music-request.git
cd twitch-music-request
npm install
cp .env.example .env
```

Edit `.env`:
```env
TWITCH_CHANNEL=your_twitch_channel
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CHANNEL_ID=your_discord_channel_id
```

### 5. Run

```bash
npm start
```

## 📱 Usage

### For Viewers
```
!music never gonna give you up
!music https://www.youtube.com/watch?v=dQw4w9WgXcQ
!music lofi hip hop
```

### For Streamers
1. Run `npm start`
2. Approve/reject requests from Discord (works on mobile!)
3. Music plays automatically on your PC

### Web Control Panel
Open `http://localhost:3000` on your phone/tablet to:
- See current song and queue
- Skip songs

Find your PC's IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux), then access `http://YOUR_IP:3000` from any device on your network.

## 📺 OBS Integration

### Now Playing Overlay
1. Add a **Browser Source** in OBS
2. URL: `http://localhost:3000/overlay.html`
3. Size: 400x120
4. Check "Shutdown source when not visible"

## 🔇 Running in Background (Windows)

Create a `start-music.vbs` file:
```vbs
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\path\to\twitch-music-request"
WshShell.Run "cmd /c node server.js", 0, False
```

Create a `stop-music.bat` file:
```bat
@echo off
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im mpv.exe >nul 2>&1
```

## 📁 Project Structure

```
twitch-music-request/
├── server.js           # Main server
├── package.json
├── .env                # Your config (not shared)
├── .env.example        # Config template
└── public/
    ├── index.html      # Web control panel
    └── overlay.html    # OBS overlay
```

## ❓ FAQ

**Q: Music doesn't play?**
A: Make sure mpv is installed and in your PATH. Test with `mpv --version`.

**Q: Discord bot doesn't respond?**
A: Make sure "Message Content Intent" is enabled in bot settings.

**Q: How to stop?**
A: `Ctrl+C` in terminal, or use the stop script.

## 📄 License

MIT - Use it however you want!

---

Made with ❤️ for streamers
