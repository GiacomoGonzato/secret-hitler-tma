import { useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { io, Socket } from 'socket.io-client';
import { Board } from './components/Board';
import { GlassContainer } from './components/GlassContainer';
import { ActionPanel } from './components/ActionPanel';

export default function App() {
  const [gameState, setGameState] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showRole, setShowRole] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    // 1. Initialize Telegram Mini App SDK
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor('#111111');
    WebApp.setBackgroundColor('#111111');
    
    // Prevent scroll-jank on mobile (from section 7.1)
    if (WebApp.disableVerticalSwipes) {
      WebApp.disableVerticalSwipes();
    }

    // 2. Extract Game ID
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = WebApp.initDataUnsafe?.start_param || urlParams.get('g');

    if (!gameId) {
      // In a real app, you might want to show an error screen here
      console.error("No gameId provided via start_param or URL query.");
    }

    // 3. Connect to WebSocket with Telegram initData for auth
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const newSocket = io(apiUrl, {
      auth: { initData: WebApp.initData || 'MOCK_DATA_FOR_LOCAL_DEV' } // Replace mock for pure local web testing if needed
    });

    newSocket.on('connect', () => {
      newSocket.emit('JOIN_GAME', { gameId });
    });

    newSocket.on('STATE', (state) => {
      setGameState(state);
      // Haptic feedback on turn transition if it's your turn
      if (state.status !== gameState?.status) {
        WebApp.HapticFeedback.notificationOccurred('success');
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error("Socket Auth Error:", err.message);
      WebApp.HapticFeedback.notificationOccurred('error');
    });

    setSocket(newSocket);

    // 4. Anti-leak UI: Blur when app goes into background
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        setShowRole(false);
      } else {
        setIsBlurred(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      newSocket.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Loading State
  if (!gameState || !socket) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-gray-600 border-t-red-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium tracking-widest uppercase text-sm animate-pulse">
          Connecting to Table...
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-dark bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 to-black p-4 font-sans selection:bg-red-500/30 transition-all duration-300 ${isBlurred ? 'blur-xl grayscale' : ''}`}>
      
      {/* Header Info */}
      <GlassContainer className="flex justify-between items-center mb-4 text-gray-200">
         <div className="font-bold text-sm tracking-wider">
           <span className="text-red-500 mr-2">●</span> 
           {gameState.status.replace('_', ' ')}
         </div>
         <div className="flex gap-4 text-xs font-bold text-gray-400">
           <span>DECK: {gameState.deckCount}</span>
           <span>DISCARD: {gameState.discardCount}</span>
         </div>
      </GlassContainer>

      {/* Secret Role Card Reveal (Anti-Leak Tap & Hold) */}
      <GlassContainer 
        className="mb-6 border-yellow-500/30 bg-yellow-900/10 text-center py-6 cursor-pointer select-none touch-none active:scale-[0.98] transition-transform"
        onPointerDown={() => setShowRole(true)}
        onPointerUp={() => setShowRole(false)}
        onPointerLeave={() => setShowRole(false)}
        onContextMenu={(e) => e.preventDefault()} // prevent context menu on long press
      >
         <div className="text-yellow-500/50 text-xs font-black tracking-widest uppercase mb-1">
           {showRole ? 'Release to Hide' : 'Tap & Hold to Reveal Identity'}
         </div>
         
         <div className={`transition-opacity duration-200 ${showRole ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
           <div className="text-4xl font-black text-white uppercase tracking-widest drop-shadow-md mt-2">
             {gameState.you.role}
           </div>
           <div className={`text-sm mt-1 font-bold tracking-widest ${gameState.you.party === 'liberal' ? 'text-blue-400' : 'text-red-400'}`}>
             {gameState.you.party.toUpperCase()} PARTY
           </div>
           
           {/* If Fascist or Hitler (in 5-6 player games), show known allies here */}
           {gameState.knownAllies?.length > 0 && (
             <div className="mt-4 border-t border-white/10 pt-3">
               <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Known Allies:</span>
               <div className="flex justify-center gap-2 flex-wrap">
                 {gameState.knownAllies.map((ally: any) => (
                   <span key={ally.id} className="bg-white/10 text-white text-xs px-2 py-1 rounded">
                     {ally.name} ({ally.role})
                   </span>
                 ))}
               </div>
             </div>
           )}
         </div>
         
         {!showRole && (
           <div className="text-3xl font-black text-gray-600 uppercase tracking-widest drop-shadow-md mt-2">
             CLASSIFIED
           </div>
         )}
      </GlassContainer>

      {/* Game Board Tracks */}
      <Board 
        liberalPolicies={gameState.liberalPolicies} 
        fascistPolicies={gameState.fascistPolicies} 
        electionTracker={gameState.electionTracker} 
      />

      {/* Player List (Ring / Table) */}
      <div className="mt-8 mb-6">
        <h3 className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3 px-2">Table Seating</h3>
        <div className="grid gap-2">
          {gameState.players.map((p: any) => (
             <GlassContainer key={p.id} className={`flex items-center justify-between py-2.5 px-3 border-white/5 ${!p.alive ? 'opacity-40 grayscale bg-black/40' : 'bg-white/5'}`}>
                <div className="flex items-center gap-3 text-white">
                  
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center text-sm font-bold shadow-inner relative">
                    {p.name.charAt(0).toUpperCase()}
                    {!p.connected && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-gray-900" title="Disconnected"></span>
                    )}
                  </div>
                  
                  {/* Name & Status Badges */}
                  <div className="flex flex-col">
                    <span className={`font-medium text-base leading-tight ${!p.alive ? 'line-through text-gray-400' : ''}`}>
                      {p.name}
                    </span>
                    <div className="flex gap-1 mt-0.5">
                      {p.id === gameState.presidentIdx && <span className="bg-yellow-500/20 text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-yellow-500/30">PRES</span>}
                      {p.id === gameState.chancellorIdx && <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-500/30">CHANC</span>}
                      {p.investigated && <span className="bg-purple-500/20 text-purple-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30">INVESTIGATED</span>}
                      {/* Show voting status during VOTING phase */}
                      {gameState.status === 'VOTING' && p.alive && (
                         <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${p.voted ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                           {p.voted ? 'VOTED' : 'THINKING'}
                         </span>
                      )}
                    </div>
                  </div>
                  
                </div>

                {/* If role is known (because it's the player, an ally, or game over) */}
                {p.role && (
                  <div className={`text-[10px] font-black tracking-wider uppercase px-2 py-1 rounded bg-black/40 ${p.party === 'liberal' ? 'text-blue-400' : 'text-red-400'}`}>
                    {p.role}
                  </div>
                )}
             </GlassContainer>
          ))}
        </div>
      </div>

      {/* Phase-driven Action Panel */}
      <ActionPanel gameState={gameState} socket={socket} />

    </div>
  );
}
