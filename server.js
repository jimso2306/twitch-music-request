require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const tmi = require('tmi.js');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════
const TWITCH_CHANNEL = process.env.TWITCH_CHANNEL;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const PORT = process.env.PORT || 3000;
const CACHE_DIR = path.join(__dirname, 'cache');

// Create cache directory
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

if (!TWITCH_CHANNEL || !DISCORD_TOKEN || !DISCORD_CHANNEL_ID) {
  console.error('❌ Missing configuration!');
  console.error('Create a .env file with:');
  console.error('  TWITCH_CHANNEL=your_channel_name');
  console.error('  DISCORD_TOKEN=your_discord_token');
  console.error('  DISCORD_CHANNEL_ID=your_channel_id');
  process.exit(1);
}

// ═══════════════════════════════════════
// MUSIC PLAYER (mpv + preloading)
// ═══════════════════════════════════════
const queue = [];
let currentSong = null;
let mpvProcess = null;
let isPlaying = false;
const downloadingSet = new Set();

// Preload a song (download audio)
function preloadSong(song) {
  if (downloadingSet.has(song.videoId)) return;
  
  const filePath = path.join(CACHE_DIR, `${song.videoId}.opus`);
  if (fs.existsSync(filePath)) {
    song.filePath = filePath;
    console.log(`📦 Already cached: ${song.title}`);
    return;
  }
  
  downloadingSet.add(song.videoId);
  console.log(`⬇️ Preloading: ${song.title}`);
  
  const url = `https://www.youtube.com/watch?v=${song.videoId}`;
  const ytdlp = spawn('yt-dlp', [
    '-x',
    '--audio-format', 'opus',
    '-o', filePath,
    '--no-playlist',
    '-q',
    url
  ]);
  
  ytdlp.on('close', (code) => {
    downloadingSet.delete(song.videoId);
    if (code === 0 && fs.existsSync(filePath)) {
      song.filePath = filePath;
      console.log(`✅ Preloaded: ${song.title}`);
    } else {
      console.log(`⚠️ Preload failed: ${song.title}`);
    }
  });
  
  ytdlp.on('error', () => {
    downloadingSet.delete(song.videoId);
  });
}

// Preload next songs in queue
function preloadQueue() {
  queue.slice(0, 2).forEach(song => preloadSong(song));
}

// Clean old cache files
function cleanCache() {
  const files = fs.readdirSync(CACHE_DIR);
  const activeIds = new Set([
    currentSong?.videoId,
    ...queue.map(s => s.videoId)
  ].filter(Boolean));
  
  files.forEach(file => {
    const videoId = file.replace('.opus', '');
    if (!activeIds.has(videoId)) {
      fs.unlinkSync(path.join(CACHE_DIR, file));
    }
  });
}

function playNext() {
  // Clean old files
  cleanCache();
  
  if (queue.length === 0) {
    currentSong = null;
    isPlaying = false;
    console.log('📭 Queue empty');
    io.emit('queue-update', { queue, currentSong });
    return;
  }

  currentSong = queue.shift();
  isPlaying = true;
  io.emit('queue-update', { queue, currentSong });
  
  // Preload next songs
  preloadQueue();

  if (mpvProcess) {
    mpvProcess.kill();
  }

  // Use cached file if available, otherwise stream
  if (currentSong.filePath && fs.existsSync(currentSong.filePath)) {
    console.log(`▶️ Playing (cached): ${currentSong.title}`);
    mpvProcess = spawn('mpv', [
      '--no-video',
      '--really-quiet',
      currentSong.filePath
    ]);
  } else {
    console.log(`⏳ Playing (streaming): ${currentSong.title}`);
    io.emit('loading');
    const url = `https://www.youtube.com/watch?v=${currentSong.videoId}`;
    mpvProcess = spawn('mpv', [
      '--no-video',
      '--really-quiet',
      '--cache=yes',
      '--cache-secs=5',
      '--demuxer-max-bytes=50M',
      '--ytdl-format=bestaudio',
      url
    ]);
  }

  mpvProcess.on('spawn', () => {
    console.log(`▶️ Playing: ${currentSong.title}`);
  });

  mpvProcess.on('close', () => {
    console.log(`✅ Finished: ${currentSong?.title}`);
    playNext();
  });

  mpvProcess.on('error', (err) => {
    console.error('❌ mpv error:', err.message);
    playNext();
  });
}

function skipSong() {
  console.log('⏭ Skipping...');
  if (mpvProcess) {
    mpvProcess.kill('SIGKILL');
    mpvProcess = null;
  }
  spawn('taskkill', ['/f', '/im', 'mpv.exe'], { shell: true });
}

// ═══════════════════════════════════════
// WEB SERVER
// ═══════════════════════════════════════
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════
// DISCORD BOT
// ═══════════════════════════════════════
const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const pendingRequests = new Map();

discord.once('ready', () => {
  console.log(`✅ Discord connected: ${discord.user.tag}`);
});

discord.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const [action] = interaction.customId.split('_');
  const request = pendingRequests.get(interaction.message.id);

  if (!request) {
    await interaction.reply({ content: '❌ Request expired', ephemeral: true });
    return;
  }

  if (action === 'approve') {
    queue.push(request);
    pendingRequests.delete(interaction.message.id);

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x00ff00)
      .setFooter({ text: `✅ Approved • Position: #${queue.length}` });

    await interaction.update({ embeds: [embed], components: [] });
    console.log(`✅ Approved: ${request.title}`);

    // Start preloading this song
    preloadSong(request);

    if (!isPlaying) {
      playNext();
    } else {
      io.emit('queue-update', { queue, currentSong });
    }

  } else if (action === 'reject') {
    pendingRequests.delete(interaction.message.id);

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0xff0000)
      .setFooter({ text: '❌ Rejected' });

    await interaction.update({ embeds: [embed], components: [] });
    console.log(`❌ Rejected: ${request.title}`);
  }
});

discord.login(DISCORD_TOKEN);

// ═══════════════════════════════════════
// TWITCH BOT
// ═══════════════════════════════════════
const twitch = new tmi.Client({
  channels: [TWITCH_CHANNEL]
});

twitch.connect().then(() => {
  console.log(`✅ Twitch connected: #${TWITCH_CHANNEL}`);
}).catch(console.error);

function extractYouTubeId(input) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function searchYouTube(query) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();
    const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  } catch (e) {
    console.log('YouTube search error:', e);
  }
  return null;
}

async function getVideoInfo(videoId) {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      title: data.title || 'Unknown title',
      author: data.author_name || 'Unknown artist',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    };
  } catch {
    return {
      title: 'YouTube Video',
      author: 'Unknown',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    };
  }
}

twitch.on('message', async (channel, tags, message, self) => {
  if (!message.toLowerCase().startsWith('!music ')) return;

  const input = message.slice(7).trim();
  if (!input) return;

  let videoId = extractYouTubeId(input);

  if (!videoId) {
    console.log(`🔍 Searching: "${input}"`);
    videoId = await searchYouTube(input);
  }

  if (!videoId) {
    console.log(`⚠️ No results for: ${input}`);
    return;
  }

  const user = tags['display-name'] || tags.username;
  const info = await getVideoInfo(videoId);

  if (!info) {
    console.log(`⚠️ Video not found: ${videoId}`);
    return;
  }

  const request = {
    id: Date.now().toString(),
    videoId,
    title: info.title,
    author: info.author,
    thumbnail: info.thumbnail,
    user,
    timestamp: new Date()
  };

  const discordChannel = await discord.channels.fetch(DISCORD_CHANNEL_ID);

  const embed = new EmbedBuilder()
    .setColor(0x9147ff)
    .setTitle(info.title)
    .setURL(`https://www.youtube.com/watch?v=${videoId}`)
    .setAuthor({ name: `🎵 Request from ${user}` })
    .setDescription(`**Artist:** ${info.author}`)
    .setThumbnail(info.thumbnail)
    .setTimestamp();

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`approve_${request.id}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`reject_${request.id}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

  const msg = await discordChannel.send({ embeds: [embed], components: [buttons] });
  pendingRequests.set(msg.id, request);

  console.log(`🎵 New request: ${info.title} by ${user}`);
});

// ═══════════════════════════════════════
// SOCKET.IO
// ═══════════════════════════════════════
io.on('connection', (socket) => {
  console.log('📱 Client connected');
  socket.emit('queue-update', { queue, currentSong });
  
  socket.on('skip', () => {
    console.log('⏭ Skip requested');
    skipSong();
  });
  
  socket.on('disconnect', () => {
    console.log('📱 Client disconnected');
  });
});

// ═══════════════════════════════════════
// START
// ═══════════════════════════════════════
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎵 Twitch Music Request');
  console.log('═══════════════════════════════════════════');
  console.log(`📺 Twitch: #${TWITCH_CHANNEL}`);
  console.log(`💬 Command: !music <title or link>`);
  console.log(`📱 Control: http://localhost:${PORT}`);
  console.log(`🎨 OBS Overlay: http://localhost:${PORT}/overlay.html`);
  console.log('═══════════════════════════════════════════');
  console.log('');
});

process.on('SIGINT', () => {
  if (mpvProcess) mpvProcess.kill();
  process.exit();
});
