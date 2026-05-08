import { useEffect, useState, useRef, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const WS_URL = (API_URL.replace('http', 'ws'));

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [round, setRound] = useState(null);
  const [liveBets, setLiveBets] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    // Fetch initial chat messages
    fetch(`${API_URL}/api/messages`)
      .then(res => res.json())
      .then(data => setChatMessages(data))
      .catch(console.error);

    const connect = () => {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('✓ WebSocket connected');
        setConnected(true);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'round:waiting') {
          setRound({
            id: data.id,
            status: 'WAITING',
            waitTime: data.waitTime,
            startTime: data.startTime
          });
          setLiveBets([]); // Clear bets for new round
        } else if (data.type === 'round:started') {
          setRound(data.round);
        } else if (data.type === 'round:flying') {
          setRound(prev => ({
            ...prev,
            multiplier: data.multiplier,
            timestamp: Date.now()
          }));
        } else if (data.type === 'round:crashed') {
          setRound(prev => ({
            ...prev,
            status: 'CRASHED',
            crashPoint: data.crashPoint
          }));
        } else if (data.type === 'round:state') {
          setRound(data.round);
        } else if (data.type === 'bet:placed') {
          setLiveBets(prev => [...prev, data.bet]);
        } else if (data.type === 'bet:cashed_out') {
          setLiveBets(prev => prev.map(bet => 
            bet.betId === data.betId 
              ? { ...bet, cashedOut: true, multiplier: data.multiplier, payout: data.payout } 
              : bet
          ));
        } else if (data.type === 'chat:message') {
          setChatMessages(prev => [...prev.slice(-49), data.message]);
        }
      };

      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
      };

      ws.current.onclose = () => {
        setConnected(false);
        console.log('✓ WebSocket disconnected, reconnecting...');
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  return { connected, round, ws, liveBets, chatMessages };
}

export function useGameState() {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [balance, setBalance] = useState(0);
  const [currentBet, setCurrentBet] = useState(null);
  const [users, setUsers] = useState([]);

  const registerUser = useCallback(async () => {
    let id = localStorage.getItem('userId');
    let name = localStorage.getItem('username');

    if (!id) {
      const tempId = Math.floor(Math.random() * 10000);
      name = `Player_${tempId}`;
      try {
        const res = await fetch(`${API_URL}/api/create-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name })
        });
        if (res.ok) {
          const data = await res.json();
          id = data.id.toString();
          name = data.username;
          localStorage.setItem('userId', id);
          localStorage.setItem('username', name);
        }
      } catch (err) {
        console.error('Registration failed:', err);
      }
    }

    setUserId(id);
    setUsername(name);
  }, []);

  const updateBalance = useCallback(async () => {
    const currentId = userId || localStorage.getItem('userId');
    if (!currentId) return;
    
    try {
      const res = await fetch(`${API_URL}/api/balance/${currentId}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      } else if (res.status === 404) {
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        registerUser();
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, [userId, registerUser]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  const switchUser = (newUserId) => {
    const user = users.find(u => u.id === newUserId);
    if (user) {
      setUserId(user.id);
      setUsername(user.username);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('username', user.username);
    }
  };

  useEffect(() => {
    registerUser();
  }, [registerUser]);

  useEffect(() => {
    if (userId) {
      updateBalance();
      fetchUsers();
      const interval = setInterval(updateBalance, 5000);
      return () => clearInterval(interval);
    }
  }, [userId, updateBalance, fetchUsers]);

  return {
    userId,
    username,
    balance,
    setBalance,
    currentBet,
    setCurrentBet,
    users,
    updateBalance,
    switchUser,
    fetchUsers
  };
}
