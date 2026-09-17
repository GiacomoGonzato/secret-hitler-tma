import { Game, Party, Player, Role } from './types';
import crypto from 'crypto';

// Creates a fresh game in the LOBBY state
export function createGame(id: string, chatId: number, hostId: number): Game {
  return {
    id, chatId, hostId, status: 'LOBBY',
    players: [], boardType: '5-6', deck: [], discard: [],
    liberalPolicies: 0, fascistPolicies: 0, electionTracker: 0,
    presidentIdx: 0, chancellorIdx: null, lastElectedPresident: null, lastElectedChancellor: null,
    votes: {}, presidentHand: [], chancellorHand: [],
    vetoUnlocked: false, winner: null, winReason: null
  };
}

// The core pure state machine
export function reduce(game: Game, action: any): Game {
  const newGame = { ...game, players: [...game.players], votes: { ...game.votes } };

  switch (action.type) {
    case 'JOIN': {
      if (game.status !== 'LOBBY') throw new Error('Game already started');
      if (game.players.length >= 10) throw new Error('Lobby is full');
      if (game.players.some(p => p.id === action.user.id)) return game; // Already joined
      
      newGame.players.push({
        id: action.user.id,
        name: action.user.first_name,
        seat: game.players.length,
        role: 'liberal', party: 'liberal', // Temp assignment
        alive: true, investigated: false, connected: true
      });
      break;
    }

    case 'START': {
      if (game.status !== 'LOBBY') throw new Error('Already started');
      if (game.players.length < 5) throw new Error('Need at least 5 players');
      
      // Setup Board Type
      if (game.players.length <= 6) newGame.boardType = '5-6';
      else if (game.players.length <= 8) newGame.boardType = '7-8';
      else newGame.boardType = '9-10';

      // Setup Roles
      const roleConfig = getRoleDistribution(game.players.length);
      const shuffledRoles = shuffleArray(roleConfig);
      
      newGame.players = game.players.map((p, i) => ({
        ...p,
        role: shuffledRoles[i],
        party: shuffledRoles[i] === 'liberal' ? 'liberal' : 'fascist',
        seat: i
      }));

      // Setup Deck (11 Fascist, 6 Liberal)
      const deck: Party[] = [...Array(11).fill('fascist'), ...Array(6).fill('liberal')];
      newGame.deck = shuffleArray(deck);
      newGame.presidentIdx = Math.floor(Math.random() * game.players.length);
      newGame.status = 'NIGHT';
      break;
    }

    case 'VOTE': {
      if (game.status !== 'VOTING') throw new Error('Not voting phase');
      const voter = newGame.players.find(p => p.id === action.userId);
      if (!voter || !voter.alive) throw new Error('Invalid voter');

      newGame.votes[action.userId] = action.vote;

      // Check if all alive players voted
      const alivePlayers = newGame.players.filter(p => p.alive);
      if (Object.keys(newGame.votes).length === alivePlayers.length) {
         // Resolve election
         const jas = Object.values(newGame.votes).filter(v => v === 'ja').length;
         if (jas > alivePlayers.length / 2) {
             // Election passed
             newGame.lastElectedPresident = newGame.players[newGame.presidentIdx].id;
             newGame.lastElectedChancellor = newGame.players[newGame.chancellorIdx!].id;
             newGame.electionTracker = 0;
             newGame.status = 'PRESIDENT_DISCARD';
             
             // Draw 3 tiles
             newGame.presidentHand = newGame.deck.splice(0, 3);
         } else {
             // Election failed
             newGame.electionTracker += 1;
             newGame.presidentIdx = getNextAlivePlayer(newGame, newGame.presidentIdx);
             newGame.chancellorIdx = null;
             newGame.votes = {};
             newGame.status = 'NOMINATION';
             // Note: Chaos handler would go here if tracker === 3
         }
      }
      break;
    }
    // ... Implement 'NOMINATE', 'DISCARD', 'ENACT', 'EXECUTE', etc. based on Section 5 specs
  }

  return newGame;
}

// Helpers
function getRoleDistribution(count: number): Role[] {
    const dist: Record<number, {l: number, f: number, h: number}> = {
        5: {l: 3, f: 1, h: 1}, 6: {l: 4, f: 1, h: 1},
        7: {l: 4, f: 2, h: 1}, 8: {l: 5, f: 2, h: 1},
        9: {l: 5, f: 3, h: 1}, 10:{l: 6, f: 3, h: 1}
    };
    const c = dist[count];
    return [...Array(c.l).fill('liberal'), ...Array(c.f).fill('fascist'), 'hitler'];
}

function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getNextAlivePlayer(game: Game, currentIdx: number): number {
    let nextIdx = (currentIdx + 1) % game.players.length;
    while (!game.players[nextIdx].alive) {
        nextIdx = (nextIdx + 1) % game.players.length;
    }
    return nextIdx;
}
