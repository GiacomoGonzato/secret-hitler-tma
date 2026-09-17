import Redis from 'ioredis';
import { Game } from './game/types';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const redis = new Redis(REDIS_URL);

export async function getGame(gameId: string): Promise<Game | null> {
  const data = await redis.get(`game:${gameId}`);
  return data ? JSON.parse(data) : null;
}

export async function saveGame(game: Game): Promise<void> {
  // Set game state with a 24-hour TTL (Time To Live)
  await redis.set(`game:${game.id}`, JSON.stringify(game), 'EX', 60 * 60 * 24);
}

// Simple locking mechanism to prevent race conditions on concurrent socket events
export async function withGameLock(gameId: string, fn: (game: Game) => Promise<Game | void>) {
  const lockKey = `lock:game:${gameId}`;
  const locked = await redis.set(lockKey, 'locked', 'NX', 'PX', 2000);
  if (!locked) throw new Error('Game is currently processing another action.');

  try {
    const game = await getGame(gameId);
    if (!game) throw new Error('Game not found.');
    const newGame = await fn(game);
    if (newGame) await saveGame(newGame);
  } finally {
    await redis.del(lockKey);
  }
}
