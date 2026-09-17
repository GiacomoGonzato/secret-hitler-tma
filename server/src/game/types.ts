export type Party = 'liberal' | 'fascist';
export type Role = 'liberal' | 'fascist' | 'hitler';
export type GameStatus = 'LOBBY'|'NIGHT'|'NOMINATION'|'VOTING'|'PRESIDENT_DISCARD'|'CHANCELLOR_ENACT'|'VETO_PROMPT'|'EXECUTIVE_ACTION'|'GAME_OVER';

export interface Player {
  id: number;
  name: string;
  seat: number;
  role: Role;
  party: Party;
  alive: boolean;
  investigated: boolean;
  connected: boolean;
}

export interface Game {
  id: string;
  chatId: number;
  hostId: number;
  status: GameStatus;
  players: Player[];
  boardType: '5-6' | '7-8' | '9-10';
  deck: Party[];
  discard: Party[];
  liberalPolicies: number;
  fascistPolicies: number;
  electionTracker: 0 | 1 | 2 | 3;
  presidentIdx: number;
  chancellorIdx: number | null;
  lastElectedPresident: number | null;
  lastElectedChancellor: number | null;
  votes: Record<number, 'ja' | 'nein'>;
  presidentHand: Party[];
  chancellorHand: Party[];
  vetoUnlocked: boolean;
  winner: Party | null;
  winReason: string | null;
}
