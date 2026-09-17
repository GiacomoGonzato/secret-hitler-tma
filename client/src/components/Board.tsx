import React from 'react';
import { GlassContainer } from './GlassContainer';

interface BoardProps {
  liberalPolicies: number;
  fascistPolicies: number;
  electionTracker: number;
}

export const Board: React.FC<BoardProps> = ({ liberalPolicies, fascistPolicies, electionTracker }) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto mt-4 text-white">
      
      {/* Liberal Track */}
      <GlassContainer className="bg-blue-900/40 border-blue-500/30">
        <h2 className="text-xl font-bold tracking-widest text-blue-200 mb-3 uppercase shadow-sm">Liberal Policies</h2>
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((slot, i) => (
            <div key={i} className={`w-12 h-16 rounded-md border-2 ${i < liberalPolicies ? 'bg-blue-500 border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-black/20 border-white/10'} flex items-center justify-center`}>
                {i === 4 && i >= liberalPolicies && <span className="text-[10px] text-center text-white/40">VICTORY</span>}
            </div>
          ))}
        </div>
      </GlassContainer>

      {/* Fascist Track */}
      <GlassContainer className="bg-red-900/40 border-red-500/30">
        <h2 className="text-xl font-bold tracking-widest text-red-200 mb-3 uppercase">Fascist Policies</h2>
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5, 6].map((slot, i) => (
            <div key={i} className={`w-10 h-14 rounded-md border-2 ${i < fascistPolicies ? 'bg-red-600 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-black/20 border-white/10'} flex flex-col items-center justify-center relative`}>
                {/* Icons for powers would go here based on board size */}
                {i === 5 && i >= fascistPolicies && <span className="text-[8px] text-center text-white/40">VICTORY</span>}
            </div>
          ))}
        </div>
      </GlassContainer>

      {/* Election Tracker */}
      <div className="flex justify-center items-center gap-3 mt-2">
        <span className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Election Tracker</span>
        <div className="flex gap-2">
          {[1, 2, 3].map((slot, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border border-white/30 ${electionTracker > i ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'bg-black/30'}`} />
          ))}
        </div>
      </div>
      
    </div>
  );
};
