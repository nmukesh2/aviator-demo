import express from 'express';
import { run, get, all } from '../db.js';

const router = express.Router();

// Get recent messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await all('SELECT * FROM messages ORDER BY id DESC LIMIT 50');
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/messages', async (req, res) => {
  try {
    const { userId, username, content } = req.body;

    if (!userId || !username || !content) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const result = await run(
      'INSERT INTO messages (user_id, username, content) VALUES (?, ?, ?)',
      [userId, username, content]
    );

    const messageData = {
      id: result.lastID,
      userId,
      username,
      content,
      created_at: new Date().toISOString()
    };

    if (req.broadcast) {
      req.broadcast({
        type: 'chat:message',
        message: messageData
      });
    }

    res.json(messageData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
