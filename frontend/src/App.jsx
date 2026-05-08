import { useEffect, useState } from 'react';
import { useWebSocket, useGameState } from './hooks/useWebSocket';
import { GameScreen } from './components/GameScreen';
import { UserSelector } from './components/UserSelector';
import { LiveBets } from './components/LiveBets';
import { AdminDashboard } from './components/AdminDashboard';

function App() {
  const { connected, round, liveBets, chatMessages } = useWebSocket();
  const gameState = useGameState();
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    gameState.fetchUsers();
    const interval = setInterval(() => gameState.fetchUsers(), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1116] text-white selection:bg-red-500/30">
      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
      
      {/* Header */}
      <header className="bg-[#1b1d24] border-b border-white/5 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/40">
              <span className="text-2xl">🛩️</span>
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-white">Aviator</h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                <span className="text-[10px] text-gray-500 uppercase font-bold">{connected ? 'Network Stable' : 'Offline'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="px-4 py-1.5 bg-gray-800 hover:bg-purple-600/20 hover:text-purple-400 border border-white/5 hover:border-purple-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Admin Audit
            </button>
            <div className="text-right">
              <div className="text-[10px] text-gray-500 uppercase font-bold">Your Balance</div>
              <div className="text-xl font-black text-green-400">${gameState.balance.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Live Bets Sidebar */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <LiveBets 
              bets={liveBets} 
              chatMessages={chatMessages} 
              userId={gameState.userId} 
              username={gameState.username}
            />
          </div>

          {/* Game Area */}
          <div className="lg:col-span-9 order-1 lg:order-2 space-y-6">
            {/* Game Screen */}
            <GameScreen
              round={round}
              liveBets={liveBets}
              userId={gameState.userId}
              balance={gameState.balance}
              updateBalance={gameState.updateBalance}
            />

            {/* User Selector */}
            <UserSelector
              users={gameState.users}
              currentUserId={gameState.userId}
              onSwitchUser={gameState.switchUser}
            />
          </div>
        </div>

        {/* Info Section */}
        <footer className="mt-8 p-6 bg-[#1b1d24] rounded-2xl border border-white/5 text-xs text-gray-500 leading-relaxed">
          <p className="uppercase font-bold mb-2 tracking-widest text-gray-400">Quick Guide</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Place your bet during the 5s <span className="text-red-500 font-bold">WAITING</span> period.</li>
            <li>Watch the <span className="text-white font-bold">MULTIPLIER</span> increase as the plane flies.</li>
            <li>Press <span className="text-orange-500 font-bold">CASHOUT</span> to secure your winnings before the plane flies away!</li>
            <li>If the plane crashes first, you lose your bet. Good luck!</li>
          </ul>
        </footer>
      </main>
    </div>
  );
}

export default App;
