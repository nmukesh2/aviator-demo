import { useEffect, useState, useRef } from 'react';

export function MultiplierChart({ round }) {
  const [countdown, setCountdown] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const animationRef = useRef();

  useEffect(() => {
    if (!round) return;

    if (round.status === 'WAITING') {
      const interval = setInterval(() => {
        const remaining = Math.max(0, (round.startTime - Date.now()) / 1000);
        setCountdown(remaining.toFixed(1));
      }, 100);
      return () => clearInterval(interval);
    }

    if (round.status === 'FLYING') {
      const update = () => {
        const elapsed = (Date.now() - round.startTime) / 1000;
        const currentMult = Math.pow(1.08, elapsed);
        setMultiplier(currentMult);
        animationRef.current = requestAnimationFrame(update);
      };
      animationRef.current = requestAnimationFrame(update);
      return () => cancelAnimationFrame(animationRef.current);
    }

    if (round.status === 'CRASHED') {
      setMultiplier(round.crashPoint);
    }
  }, [round]);

  // Calculate path and plane position
  // We use a simple curve: y = x^1.5 or similar
  const getPlanePos = (m) => {
    const x = Math.min(80, (m - 1) * 10); // Horizontal progress
    const y = Math.min(80, Math.pow(m - 1, 1.2) * 5); // Vertical progress
    return { x: 10 + x, y: 90 - y };
  };

  const pos = getPlanePos(multiplier);

  return (
    <div className="relative w-full h-80 bg-[#0f1116] rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      {/* WAITING State */}
      {round?.status === 'WAITING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
          <div className="text-gray-400 text-sm uppercase tracking-widest mb-2">Next Round In</div>
          <div className="text-6xl font-black text-white tabular-nums">
            {countdown}s
          </div>
          <div className="mt-4 w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-600 transition-all duration-100" 
              style={{ width: `${(countdown / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* FLYING / CRASHED State */}
      {(round?.status === 'FLYING' || round?.status === 'CRASHED') && (
        <>
          {/* Main Multiplier Display */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            <div className={`text-8xl font-black transition-colors duration-300 ${round.status === 'CRASHED' ? 'text-red-600' : 'text-white'}`}>
              {multiplier.toFixed(2)}x
            </div>
            {round.status === 'CRASHED' && (
              <div className="text-center text-red-500 font-bold text-2xl animate-bounce">
                FLEW AWAY!
              </div>
            )}
          </div>

          {/* SVG Flight Path */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Trail */}
            <path
              d={`M 10 90 Q ${pos.x} 90 ${pos.x} ${pos.y}`}
              fill="none"
              stroke="url(#trailGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>

            {/* Plane Icon */}
            {round.status === 'FLYING' && (
              <g transform={`translate(${pos.x - 2}, ${pos.y - 2}) rotate(${-15})`}>
                <path
                  d="M21,16L21,14L13,9L13,3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5L10,9L2,14L2,16L10,13.5L10,19L8,20.5L8,22L11.5,21L15,22L15,20.5L13,19L13,13.5L21,16Z"
                  fill="#ef4444"
                  className="w-8 h-8 scale-[0.2]"
                />
              </g>
            )}
          </svg>
        </>
      )}

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 border-t border-white/5 flex justify-between items-center text-[8px] text-gray-500 uppercase tracking-tighter">
        <div className="flex items-center gap-2">
          <span className="bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20">Provably Fair</span>
          {round?.hash && (
            <span className="font-mono opacity-50 truncate max-w-[100px]">SHA256: {round.hash}</span>
          )}
        </div>
        <span>Round #{round?.id || '---'}</span>
      </div>
    </div>
  );
}
