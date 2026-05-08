import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDB } from './db.js';
import GameEngine from './game-engine.js';
import usersRouter from './routes/users.js';
import betsRouter from './routes/bets.js';
import chatRouter from './routes/chat.js';
import adminRouter from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// HTTP Server + WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Game Engine with broadcast capability
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(data));
    }
  });
};

const gameEngine = new GameEngine(broadcast);

// Routes
app.use('/api', usersRouter);
app.use('/api', (req, res, next) => {
  req.broadcast = broadcast;
  next();
}, betsRouter);
app.use('/api', (req, res, next) => {
  req.broadcast = broadcast;
  next();
}, chatRouter);
app.use('/api', adminRouter);

app.get('/api/rounds/recent', async (req, res) => {
  try {
    const { all } = await import('./db.js');
    const rounds = await all('SELECT * FROM rounds WHERE status = ? ORDER BY id DESC LIMIT 20', ['CRASHED']);
    res.json(rounds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const { all } = await import('./db.js');
    const winners = await all(`
      SELECT u.username, b.amount, b.cashout_multiplier, b.payout, b.created_at 
      FROM bets b 
      JOIN users u ON b.user_id = u.id 
      WHERE b.status = 'WON' 
      ORDER BY b.payout DESC 
      LIMIT 10
    `);
    res.json(winners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket handlers
wss.on('connection', (ws) => {
  console.log('✓ Client connected');
  
  const currentRound = gameEngine.getCurrentRound();
  if (currentRound) {
    ws.send(JSON.stringify({
      type: 'round:state',
      round: currentRound
    }));
  }

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('Received:', data.type);
    } catch (err) {
      console.error('WS message error:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('✓ Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WS error:', err.message);
  });
});

// Initialize and start
async function start() {
  try {
    await initializeDB();
    
    // Seed test users if none exist
    const users = await import('./db.js').then(m => m.all('SELECT COUNT(*) as count FROM users', []));
    if (users[0].count === 0) {
      const { run } = await import('./db.js');
      await run('INSERT INTO users (username, balance) VALUES (?, ?)', ['Player1', 1000]);
      await run('INSERT INTO users (username, balance) VALUES (?, ?)', ['Player2', 1000]);
      await run('INSERT INTO users (username, balance) VALUES (?, ?)', ['Player3', 1000]);
      console.log('✓ Seeded test users');
    }

    gameEngine.start();
    console.log('✓ Game engine started');

    server.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ WebSocket: ws://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start();
