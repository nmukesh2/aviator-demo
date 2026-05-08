import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AdminDashboard({ onClose }) {
  const [stats, setStats] = useState(null);
  const [bets, setBets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, betsRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/stats`),
          fetch(`${API_URL}/api/admin/bets`),
          fetch(`${API_URL}/api/admin/users`)
        ]);

        if (statsRes.ok && betsRes.ok && usersRes.ok) {
          const [statsData, betsData, usersData] = await Promise.all([
            statsRes.json(),
            betsRes.json(),
            usersRes.json()
          ]);
          setStats(statsData);
          setBets(betsData);
          setUsers(usersData);
        }
      } catch (err) {
        console.error('Admin fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest animate-pulse">Loading Audit Data...</div>;

  return (
    <div className="fixed inset-0 bg-[#0f1116] z-[100] overflow-y-auto p-4 md:p-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-[#1b1d24] p-6 rounded-2xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Audit Dashboard</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">System Oversight & Risk Management</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-white/5 shadow-lg active:scale-95"
          >
            Close Audit
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Bets" value={stats?.totalBets} subValue={`Across ${stats?.totalRounds} Rounds`} color="blue" />
          <StatCard title="Bet Volume" value={`$${stats?.betVolume.toFixed(2)}`} subValue="Total Wagered" color="purple" />
          <StatCard title="Payout Volume" value={`$${stats?.payoutVolume.toFixed(2)}`} subValue="Total Won by Players" color="pink" />
          <StatCard title="House Profit" value={`$${stats?.houseProfit.toFixed(2)}`} subValue="Net System GGR" color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bets Audit */}
          <div className="bg-[#1b1d24] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Recent Bets Audit</h3>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-bold">Real-time Feed</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#1f2129] text-gray-500 uppercase font-bold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-3">Player</th>
                    <th className="px-6 py-3">Wager</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bets.map((bet, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-200 uppercase group-hover:text-purple-400 transition-colors">{bet.username}</div>
                        <div className="text-[9px] text-gray-600">Round #{bet.round_id} @ {bet.crash_point}x</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-400">${bet.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase
                          ${bet.status === 'WON' ? 'bg-green-500/10 text-green-500' : 
                            bet.status === 'LOST' ? 'bg-red-500/10 text-red-500' : 
                            'bg-blue-500/10 text-blue-500'}`}>
                          {bet.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-black ${bet.status === 'WON' ? 'text-green-400' : 'text-gray-600'}`}>
                        {bet.status === 'WON' ? `+$${bet.payout.toFixed(2)}` : '-$'+bet.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Performance Audit */}
          <div className="bg-[#1b1d24] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">User Performance Audit</h3>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold">Risk Exposure</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#1f2129] text-gray-500 uppercase font-bold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Total Bets</th>
                    <th className="px-6 py-3">Wagered</th>
                    <th className="px-6 py-3 text-right">Net GGR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user, i) => {
                    const profit = (user.total_wagered || 0) - (user.total_won || 0);
                    return (
                      <tr key={i} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-bold text-gray-200 uppercase group-hover:text-blue-400 transition-colors">{user.username}</td>
                        <td className="px-6 py-4 text-gray-400">{user.total_bets}</td>
                        <td className="px-6 py-4 text-gray-400 font-mono">${(user.total_wagered || 0).toFixed(2)}</td>
                        <td className={`px-6 py-4 text-right font-black ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-700 shadow-blue-900/20',
    purple: 'from-purple-500 to-purple-700 shadow-purple-900/20',
    pink: 'from-pink-500 to-pink-700 shadow-pink-900/20',
    green: 'from-green-500 to-green-700 shadow-green-900/20'
  };

  return (
    <div className="bg-[#1b1d24] p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color]} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`}></div>
      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{title}</div>
      <div className="text-2xl font-black text-white mb-1 tabular-nums">{value}</div>
      <div className="text-[9px] font-bold text-gray-600 uppercase">{subValue}</div>
    </div>
  );
}
