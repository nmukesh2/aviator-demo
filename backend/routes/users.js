import express from 'express';
import { run, get, all } from '../db.js';

const router = express.Router();

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await all('SELECT id, username, balance FROM users ORDER BY balance DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user balance
router.get('/balance/:userId', async (req, res) => {
  try {
    const user = await get('SELECT id, username, balance FROM users WHERE id = ?', [req.params.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create test user
router.post('/create-user', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    
    const result = await run(
      'INSERT INTO users (username, balance) VALUES (?, ?)',
      [username, 1000]
    );
    
    res.json({ id: result.lastID, username, balance: 1000 });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
