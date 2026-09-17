import { Game, Player } from './types';

// The server ONLY sends this masked state to a client
export function projectGameForPlayer(game: Game, viewerId: number) {
  const viewer = game.players.find(p => p.id === viewerId);
  
  return {
    id: game.id,
    status: game.status,
    liberalPolicies: game.liberalPolicies,
    fascistPolicies: game.fascistPolicies,
    electionTracker: game.electionTracker,
    presidentIdx: game.presidentIdx,
    chancellorIdx: game.chancellorIdx,
    deckCount: game.deck.length,
    discardCount: game.discard.length,
    vetoUnlocked: game.vetoUnlocked,
    winner: game.winner,
    winReason: game.winReason,
    // Filter players to hide secrets
    players: game.players.map(p => {
      let knownRole: string | undefined = undefined;
      let knownParty: string | undefined = undefined;

      // Reveal rules: 
      // 1. You always know yourself
      // 2. Fascists know each other
      // 3. Hitler knows fascists ONLY in 5-6 player games
      // 4. Dead players (Hitler Executed check) or investigated players are NOT publically revealed by default except via game logic claims
      if (viewer && viewer.id === p.id) {
        knownRole = p.role;
        knownParty = p.party;
      } else if (viewer && viewer.role === 'fascist' && p.party === 'fascist') {
         knownRole = p.role;
      } else if (viewer && viewer.role === 'hitler' && game.players.length <= 6 && p.party === 'fascist') {
         knownRole = p.role;
      } else if (game.status === 'GAME_OVER') {
         knownRole = p.role; // Full reveal at end
      }

      return {
        id: p.id,
        name: p.name,
        seat: p.seat,
        alive: p.alive,
        investigated: p.investigated,
        connected: p.connected,
        role: knownRole,
        party: knownParty,
        voted: game.status === 'VOTING' ? (game.votes[p.id] !== undefined) : undefined,
        voteValue: game.status !== 'VOTING' ? game.votes[p.id] : undefined
      };
    }),
    you: viewer ? { role: viewer.role, party: viewer.party, alive: viewer.alive } : null,
    // Only send hands if it's the active actor
    hand: getHandForViewer(game, viewer)
  };
}

function getHandForViewer(game: Game, viewer?: Player) {
    if (!viewer) return [];
    if (game.status === 'PRESIDENT_DISCARD' && game.players[game.presidentIdx].id === viewer.id) return game.presidentHand;
    if (game.status === 'CHANCELLOR_ENACT' && game.chancellorIdx !== null && game.players[game.chancellorIdx].id === viewer.id) return game.chancellorHand;
    return [];
}
