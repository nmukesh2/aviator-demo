import { useState, useEffect, useCallback } from 'react';
import { MultiplierChart } from './MultiplierChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function BettingPanel({ round, userId, balance, updateBalance, liveMultiplier, liveBets }) {
  const [betAmount, setBetAmount] = useState('10');
  const [betPlaced, setBetPlaced] = useState(false);
  const [betActive, setBetActive] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoBetEnabled, setAutoBetEnabled] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [autoCashout, setAutoCashout] = useState('2.00');
  const [status, setStatus] = useState('');
  const [currentBetId, setCurrentBetId] = useState(null);

  const presets = [1, 2, 5, 10];

  // Sync with liveBets for auto-cashout or external status changes
  useEffect(() => {
    if (currentBetId && liveBets) {
      const myBet = liveBets.find(b => b.betId === currentBetId);
      if (myBet?.cashedOut && betActive) {
        setStatus(`+$${myBet.payout.toFixed(2)}`);
        setBetActive(false);
        setBetPlaced(false);
        setCurrentBetId(null);
        updateBalance();
        setTimeout(() => setStatus(''), 3000);
      }
    }
  }, [liveBets, currentBetId, betActive, updateBalance]);

  const placeBet = async () => {
    if (round?.status === 'FLYING') {
      setIsQueued(true);
      setStatus('Queued for next');
      setTimeout(() => setStatus(''), 2000);
      return;
    }

    const currentUserId = userId || localStorage.getItem('userId');
    if (!currentUserId) {
      setStatus('Auth failed');
      return;
    }

    const currentRoundId = round?.id;
    if (!currentRoundId || round?.status !== 'WAITING') {
      setStatus('Wait for round');
      setTimeout(() => setStatus(''), 2000);
      return;
    }

    if (parseFloat(betAmount) > balance) {
      setStatus('Low balance');
      setTimeout(() => setStatus(''), 2000);
      setAutoBetEnabled(false); // Stop auto if balance low
      return;
    }

    try {
      console.log(`[UI] Placing bet: user=${currentUserId}, round=${currentRoundId}, amount=${betAmount}`);
      const res = await fetch(`${API_URL}/api/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(currentUserId),
          roundId: parseInt(currentRoundId),
          amount: parseFloat(betAmount),
          autoCashout: isAutoMode ? parseFloat(autoCashout) : null
        })
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`[UI] Bet success:`, data);
        setCurrentBetId(data.betId);
        setBetPlaced(true);
        setIsQueued(false);
        updateBalance();
        setStatus('BET PLACED');
      } else {
        console.error(`[UI] Bet rejected:`, data.error);
        setStatus(data.error || 'Failed');
        setTimeout(() => setStatus(''), 2000);
        if (autoBetEnabled) setIsQueued(true);
      }
    } catch (err) {
      console.error(`[UI] Fetch error:`, err);
      setStatus('Network error');
      setTimeout(() => setStatus(''), 2000);
    }
  };

  const cashOut = async () => {
    const currentUserId = userId || localStorage.getItem('userId');
    if (!currentBetId || !round?.id || !currentUserId) return;
    try {
      const res = await fetch(`${API_URL}/api/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(currentUserId),
          roundId: round.id,
          multiplier: liveMultiplier
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStatus(`+$${data.payout.toFixed(2)}`);
        setBetActive(false);
        setBetPlaced(false);
        setCurrentBetId(null);
        updateBalance();
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-bet and Queue logic
  useEffect(() => {
    if (round?.status === 'WAITING' && (autoBetEnabled || isQueued) && !betPlaced && round?.id) {
      placeBet();
    }
  }, [round?.status, autoBetEnabled, isQueued, round?.id, betPlaced]);

  useEffect(() => {
    if (round?.status === 'FLYING') {
      if (betPlaced) {
        setBetActive(true);
      }
    } else if (round?.status === 'CRASHED') {
      setBetActive(false);
      setBetPlaced(false);
      setCurrentBetId(null);
      if (autoBetEnabled) setIsQueued(true);
    } else if (round?.status === 'WAITING') {
      if (!betPlaced && !isQueued && !currentBetId) {
        setBetActive(false);
      }
    }
  }, [round?.status, betPlaced, autoBetEnabled, currentBetId, isQueued]);

  const panelPotentialPayout = (parseFloat(betAmount) * liveMultiplier).toFixed(2);

  const handleBetClick = () => {
    if (isAutoMode) {
      if (autoBetEnabled || betPlaced || isQueued) {
        setAutoBetEnabled(false);
        setBetPlaced(false);
        setIsQueued(false);
        setCurrentBetId(null);
      } else {
        setAutoBetEnabled(true);
      }
    } else {
      if (betPlaced || isQueued) {
        setBetPlaced(false);
        setIsQueued(false);
        setCurrentBetId(null);
      } else {
        placeBet();
      }
    }
  };

  return (
    <div className="bg-[#1b1d24] p-4 rounded-2xl border border-white/5 space-y-4 shadow-xl">
      <div className="flex justify-between items-center">
        <div className="flex bg-[#14151a] p-1 rounded-full border border-white/5">
          <button 
            onClick={() => { setIsAutoMode(false); setAutoBetEnabled(false); setIsQueued(false); }}
            className={`px-4 py-1 rounded-full text-[10px] uppercase font-bold transition-all ${!isAutoMode ? 'bg-gray-700 text-white' : 'text-gray-500'}`}
          >
            Bet
          </button>
          <button 
            onClick={() => setIsAutoMode(true)}
            className={`px-4 py-1 rounded-full text-[10px] uppercase font-bold transition-all ${isAutoMode ? 'bg-gray-700 text-white' : 'text-gray-500'}`}
          >
            Auto
          </button>
        </div>
        {status && <div className="text-[10px] font-bold text-green-400 uppercase animate-pulse">{status}</div>}
      </div>

      <div className="flex gap-3">
        {/* Amount Control */}
        <div className="flex-1 space-y-2">
          <div className="bg-[#14151a] rounded-xl border border-white/10 p-2 flex items-center">
            <button 
              onClick={() => setBetAmount(prev => Math.max(1, parseFloat(prev) - 1).toString())}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-white"
            >
              -
            </button>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={betPlaced || isQueued || autoBetEnabled}
              className="bg-transparent w-full text-center font-black text-xl focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button 
              onClick={() => setBetAmount(prev => (parseFloat(prev) + 1).toString())}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-white"
            >
              +
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {presets.map(p => (
              <button 
                key={p}
                onClick={() => setBetAmount(p.toString())}
                disabled={betPlaced || isQueued || autoBetEnabled}
                className="py-1 bg-[#14151a] border border-white/5 rounded-lg text-[10px] font-black hover:bg-gray-800 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-1">
          {betActive ? (
            <button
              onClick={cashOut}
              className="w-full h-full py-4 bg-gradient-to-b from-orange-400 to-orange-600 rounded-xl font-black text-xl shadow-lg shadow-orange-900/40 active:scale-95 transition-all flex flex-col items-center justify-center"
            >
              <div className="text-[10px] uppercase opacity-70 mb-1">Cash Out</div>
              <div>${panelPotentialPayout}</div>
            </button>
          ) : (
            <button
              onClick={handleBetClick}
              disabled={!round}
              className={`w-full h-full py-4 rounded-xl font-black text-xl shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center
                ${(betPlaced || isQueued || autoBetEnabled) ? 'bg-red-900/40 text-red-500 border border-red-500/50' : 'bg-gradient-to-b from-green-500 to-green-700 shadow-green-900/40'}`}
            >
              {(betPlaced || isQueued || autoBetEnabled) ? (
                <>
                  <div className="text-[10px] uppercase opacity-70 mb-1">{autoBetEnabled ? 'Auto Active' : 'Waiting...'}</div>
                  <div className="text-sm">CANCEL</div>
                </>
              ) : (
                <>
                  <div className="text-[10px] uppercase opacity-70 mb-1">{isAutoMode ? 'Enable Auto' : 'Place'}</div>
                  <div className="text-2xl">{isAutoMode ? 'AUTO' : 'BET'}</div>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Auto Cashout Toggle Section */}
      {isAutoMode && (
        <div className="flex items-center gap-3 p-2 bg-black/20 rounded-xl border border-white/5">
          <div className="text-[10px] font-bold text-gray-500 uppercase flex-1">Auto Cashout</div>
          <div className="flex items-center bg-[#14151a] rounded-lg border border-white/10 px-2">
            <input
              type="number"
              step="0.01"
              value={autoCashout}
              onChange={(e) => setAutoCashout(e.target.value)}
              disabled={betPlaced || isQueued || autoBetEnabled}
              className="bg-transparent w-16 text-center font-bold text-sm py-1 focus:outline-none"
            />
            <span className="text-[10px] font-bold text-gray-600">x</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function GameScreen({ round, liveBets, userId, balance, updateBalance }) {
  const [liveMultiplier, setLiveMultiplier] = useState(1.0);
  const [history, setHistory] = useState([]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/rounds/recent`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, round?.status]);

  useEffect(() => {
    if (!round) return;
    if (round.status === 'FLYING') {
      const elapsed = (Date.now() - round.startTime) / 1000;
      const multiplier = Math.pow(1.08, elapsed);
      setLiveMultiplier(parseFloat(multiplier.toFixed(2)));
    } else {
      setLiveMultiplier(1.0);
    }
  }, [round]);

  return (
    <div className="max-w-4xl mx-auto space-y-4 text-white font-sans">
      {/* History Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide px-1">
        {history.map((h, i) => (
          <div 
            key={i} 
            className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all whitespace-nowrap
              ${h.crash_point < 2 ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' : 
                h.crash_point < 10 ? 'bg-purple-900/20 border-purple-500/50 text-purple-400' : 
                'bg-pink-900/20 border-pink-500/50 text-pink-400'}`}
          >
            {h.crash_point.toFixed(2)}x
          </div>
        ))}
      </div>

      {/* Main Game Area */}
      <MultiplierChart round={round} />

      {/* Dual Betting Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BettingPanel 
          round={round} 
          userId={userId} 
          balance={balance} 
          updateBalance={updateBalance} 
          liveMultiplier={liveMultiplier}
          liveBets={liveBets}
        />
        <BettingPanel 
          round={round} 
          userId={userId} 
          balance={balance} 
          updateBalance={updateBalance} 
          liveMultiplier={liveMultiplier}
          liveBets={liveBets}
        />
      </div>
    </div>
  );
}
