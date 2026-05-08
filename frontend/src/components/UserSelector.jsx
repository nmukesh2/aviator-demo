export function UserSelector({ users, currentUserId, onSwitchUser }) {
  return (
    <div className="p-6 bg-[#1b1d24] rounded-2xl border border-white/5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Players</h3>
        <div className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase">
          {users.length} Online
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSwitchUser(user.id)}
            className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group
              ${parseInt(currentUserId) === user.id
                ? 'bg-red-600/10 border-red-500 text-white shadow-lg shadow-red-900/10'
                : 'bg-[#14151a] border-white/5 text-gray-400 hover:border-white/20 hover:bg-[#1f2129]'
            }`}
          >
            <div className={`font-black text-sm uppercase mb-1 transition-colors ${parseInt(currentUserId) === user.id ? 'text-white' : 'group-hover:text-white'}`}>
              {user.username}
            </div>
            <div className={`text-xs font-bold ${parseInt(currentUserId) === user.id ? 'text-red-400' : 'text-gray-500'}`}>
              ${user.balance.toFixed(0)}
            </div>
            {parseInt(currentUserId) === user.id && (
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
