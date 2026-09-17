import React, { useState } from 'react';
import { GlassContainer } from './GlassContainer';
import WebApp from '@twa-dev/sdk';
import { Socket } from 'socket.io-client';

interface ActionPanelProps {
  gameState: any;
  socket: Socket;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ gameState, socket }) => {
  const { status, you, presidentIdx, chancellorIdx } = gameState;
  const isPresident = you.alive && gameState.players[presidentIdx]?.id === you.id;
  const isChancellor = you.alive && chancellorIdx !== null && gameState.players[chancellorIdx]?.id === you.id;

  const handleVote = (vote: 'ja' | 'nein') => {
    WebApp.HapticFeedback.impactOccurred('medium');
    socket.emit('VOTE', { vote });
  };

  const handleNominate = (targetId: number) => {
    socket.emit('NOMINATE', { targetId });
  };

  // If you are dead, render Spectator Mode
  if (!you.alive) {
     return (
       <GlassContainer className="mt-4 text-center text-gray-500 py-6 border-gray-700/50">
         <span className="text-2xl">💀</span>
         <p className="mt-2 text-sm uppercase tracking-widest font-bold">Spectator Mode</p>
         <p className="text-xs mt-1">You are dead and cannot act.</p>
       </GlassContainer>
     );
  }

  return (
    <div className="mt-6 mb-24">
      {status === 'VOTING' && !gameState.you.voted && (
        <GlassContainer className="text-center bg-blue-900/10 border-blue-500/30">
          <h3 className="text-white font-bold mb-4 tracking-wider">CAST YOUR VOTE</h3>
          <div className="flex gap-4 px-4">
            <button onClick={() => handleVote('ja')} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all transform active:scale-95 text-lg">
              JA! (Yes)
            </button>
            <button onClick={() => handleVote('nein')} className="flex-1 bg-red-800 hover:bg-red-700 text-white font-black py-4 rounded-lg shadow-[0_0_15px_rgba(153,27,27,0.4)] transition-all transform active:scale-95 text-lg">
              NEIN (No)
            </button>
          </div>
        </GlassContainer>
      )}

      {status === 'VOTING' && gameState.you.voted && (
        <GlassContainer className="text-center text-gray-400">
           Waiting for other players to vote...
        </GlassContainer>
      )}

      {status === 'NOMINATION' && isPresident && (
         <GlassContainer className="text-center bg-yellow-900/20 border-yellow-500/30">
            <h3 className="text-yellow-400 font-bold mb-4 tracking-wider uppercase text-sm">You are the President</h3>
            <p className="text-gray-300 text-sm mb-4">Select a Chancellor to nominate.</p>
            <div className="grid grid-cols-2 gap-2">
               {gameState.players
                 .filter((p: any) => p.alive && p.id !== you.id)
                 .map((p: any) => (
                 <button 
                   key={p.id} 
                   onClick={() => handleNominate(p.id)}
                   className="bg-white/10 text-white py-2 rounded border border-white/5 hover:bg-white/20 active:scale-95 transition"
                 >
                   {p.name}
                 </button>
               ))}
            </div>
         </GlassContainer>
      )}

      {/* Placeholders for PRESIDENT_DISCARD and CHANCELLOR_ENACT which use the `gameState.hand` array sent securely by the projection layer */}
      {status === 'PRESIDENT_DISCARD' && isPresident && (
        <GlassContainer className="text-center bg-blue-900/20 border-blue-500/30">
           <h3 className="text-blue-300 font-bold mb-2 tracking-wider uppercase text-sm">Legislative Session</h3>
           <p className="text-gray-300 text-sm mb-4">Tap a policy to <b>DISCARD</b> it.</p>
           {/* Map over gameState.hand array here */}
           <div className="flex gap-3 justify-center">
             {gameState.hand.map((policy: string, idx: number) => (
                <div key={idx} onClick={() => socket.emit('DISCARD', { index: idx })} className={`w-16 h-24 rounded border-2 flex items-center justify-center cursor-pointer transform hover:-translate-y-2 transition shadow-lg ${policy === 'liberal' ? 'bg-blue-600 border-blue-300' : 'bg-red-600 border-red-300'}`}>
                </div>
             ))}
           </div>
        </GlassContainer>
      )}
    </div>
  );
};
