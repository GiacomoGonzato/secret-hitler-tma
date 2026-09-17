import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Bot, InlineKeyboard } from 'grammy';
import Redis from 'ioredis';
import crypto from 'crypto';

// Setup Envs
const BOT_TOKEN = process.env.BOT_TOKEN!;
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://your-render-app.com';
const REDIS_URL = process.env.REDIS_URL!;

// Init
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
const bot = new Bot(BOT_TOKEN);
const redis = new Redis(REDIS_URL);

/* --- TELEGRAM BOT LOGIC --- */
bot.command('newgame', async (ctx) => {
  const chatId = ctx.chat.id;
  const hostId = ctx.from?.id!;
  const gameId = crypto.randomBytes(5).toString('hex'); // 10 chars

  // Save to Redis
  await redis.set(`game:${gameId}:chat`, chatId);
  await redis.set(`game:${gameId}:status`, 'LOBBY');
  
  const keyboard = new InlineKeyboard()
    .webApp('▶️ Open Game', `${WEB_APP_URL}/?g=${gameId}`).row()
    .url('➕ Join', `https://t.me/${bot.botInfo.username}?start=join_${gameId}`).row()
    .text('🚀 Start', `start_${gameId}`);

  await ctx.reply(`🕵️‍♂️ <b>Secret Hitler Lobby</b>\nGame ID: <code>${gameId}</code>\nPlayers: 0/10`, {
    reply_markup: keyboard,
    parse_mode: 'HTML'
  });
});

bot.command('start', async (ctx) => {
    const payload = ctx.match;
    if (payload.startsWith('join_')) {
        const gameId = payload.split('_')[1];
        // Reply with a WebApp button strictly for this user in DM
        const kb = new InlineKeyboard().webApp('Play Now', `${WEB_APP_URL}/?g=${gameId}`);
        await ctx.reply('You have joined the lobby! Open the app to play:', { reply_markup: kb });
    }
});

bot.on('callback_query:data', async (ctx) => {
    if (ctx.callbackQuery.data.startsWith('start_')) {
        // Handle host starting game (Verify host ID in Redis)
        await ctx.answerCallbackQuery({ text: 'Game Starting!', show_alert: true });
        // Game Engine setup logic goes here...
    }
});

/* --- SOCKET.IO REALTIME SERVER --- */

// Security: Telegram initData Auth middleware
io.use((socket, next) => {
  const initData = socket.handshake.auth.initData;
  if (!validateTelegramWebAppData(initData, BOT_TOKEN)) {
      return next(new Error("Unauthorized"));
  }
  
  // Parse user info from initData
  const urlParams = new URLSearchParams(initData);
  const user = JSON.parse(urlParams.get('user')!);
  socket.data.user = user;
  next();
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  let currentGameId: string | null = null;

  socket.on('JOIN_GAME', async ({ gameId }) => {
     socket.join(`game:${gameId}`);
     currentGameId = gameId;
     // Load game from redis, project it, and emit
     // const rawGame = JSON.parse(await redis.get(`game:${gameId}`));
     // socket.emit('STATE', projectGameForPlayer(rawGame, user.id));
  });

  socket.on('VOTE', async ({ vote }) => {
      // Redlock, update state, resolve votes...
      // io.to(`game:${currentGameId}`).emit('STATE', newProjectedState);
  });
});

// Telegram validation helper
function validateTelegramWebAppData(telegramInitData: string, botToken: string): boolean {
  const initData = new URLSearchParams(telegramInitData);
  const hash = initData.get("hash");
  if (!hash) return false;
  initData.delete("hash");

  const dataCheckString = Array.from(initData.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  return calculatedHash === hash;
}

bot.start();
httpServer.listen(3000, () => console.log('Server running on port 3000'));
