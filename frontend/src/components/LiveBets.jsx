import { useState, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function LiveBets({ bets, chatMessages, userId, username }) {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, MY, TOP, CHAT
  const [leaderboard, setLeaderboard] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const myBets = bets.filter(b => b.userId === parseInt(userId));

  useEffect(() => {
    if (activeTab === 'TOP') {
      fetch(`${API_URL}/api/leaderboard`)
        .then(res => res.json())
        .then(data => setLeaderboard(data))
        .catch(console.error);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'CHAT') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(userId),
          username,
          content: chatInput
        })
      });
      setChatInput('');
    } catch (err) {
      console.error('Chat failed:', err);
    }
  };

  return (
    <div className="bg-[#1b1d24] rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[600px] shadow-2xl">
      {/* Tabs */}
      <div className="flex bg-[#1f2129] border-b border-white/5 p-1">
        {['ALL', 'MY', 'TOP', 'CHAT'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg
              ${activeTab === tab ? 'bg-gray-800 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab === 'ALL' ? 'All Bets' : tab === 'MY' ? 'My Bets' : tab === 'TOP' ? 'Top Wins' : 'Chat'}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {activeTab === 'CHAT' ? (
          <div className="flex flex-col h-full p-4 space-y-3">
            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.userId === parseInt(userId) ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase">{msg.username}</span>
                    <span className="text-[8px] text-gray-600">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words
                    ${msg.userId === parseInt(userId) ? 'bg-red-600 text-white rounded-tr-none' : 'bg-[#14151a] text-gray-300 rounded-tl-none border border-white/5'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={sendChat} className="mt-auto pt-4 border-t border-white/5 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-[#14151a] border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-red-500/50 transition-colors"
              />
              <button className="p-2 bg-red-600 rounded-xl hover:bg-red-700 transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        ) : activeTab === 'TOP' ? (
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 bg-[#1f2129] text-gray-500 uppercase font-bold border-b border-white/5 z-10">
              <tr>
                <th className="px-4 py-2">Player</th>
                <th className="px-4 py-2">Mult</th>
                <th className="px-4 py-2 text-right">Win</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-10 text-center text-gray-600 italic">No big wins yet...</td>
                </tr>
              ) : (
                leaderboard.map((win, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2 font-bold text-gray-300 uppercase truncate max-w-[80px]">{win.username}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full font-black">
                        {win.cashout_multiplier.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-black text-green-400">
                      ${win.payout.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 bg-[#1f2129] text-gray-500 uppercase font-bold border-b border-white/5 z-10">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Bet</th>
                <th className="px-4 py-2">Mult</th>
                <th className="px-4 py-2 text-right">Cashout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(activeTab === 'ALL' ? bets : myBets).length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-10 text-center text-gray-600 italic">No bets found...</td>
                </tr>
              ) : (
                (activeTab === 'ALL' ? bets : myBets).map((bet, i) => (
                  <tr 
                    key={i} 
                    className={`transition-colors ${bet.cashedOut ? 'bg-green-500/5' : 'hover:bg-white/5'}`}
                  >
                    <td className="px-4 py-2 font-bold text-gray-300 uppercase truncate max-w-[80px]">{bet.username}</td>
                    <td className="px-4 py-2 text-gray-400 font-mono">${bet.amount}</td>
                    <td className="px-4 py-2">
                      {bet.cashedOut ? (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full font-black">
                          {bet.multiplier.toFixed(2)}x
                        </span>
                      ) : (
                        <span className="text-gray-600">---</span>
                      )}
                    </td>
                    <td className={`px-4 py-2 text-right font-black ${bet.cashedOut ? 'text-white' : 'text-gray-600'}`}>
                      {bet.cashedOut ? `$${bet.payout.toFixed(2)}` : '---'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
