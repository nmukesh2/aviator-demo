import express from 'express';
import { run, get, all } from '../db.js';

const router = express.Router();

// Get global stats
router.get('/admin/stats', async (req, res) => {
  try {
    const totalBets = await get('SELECT COUNT(*) as count, SUM(amount) as volume FROM bets');
    const totalPayouts = await get('SELECT SUM(payout) as volume FROM bets WHERE status = ?', ['WON']);
    const totalRounds = await get('SELECT COUNT(*) as count FROM rounds');
    
    const stats = {
      totalBets: totalBets.count || 0,
      betVolume: totalBets.volume || 0,
      payoutVolume: totalPayouts.volume || 0,
      houseProfit: (totalBets.volume || 0) - (totalPayouts.volume || 0),
      totalRounds: totalRounds.count || 0
    };
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all bets for audit
router.get('/admin/bets', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const bets = await all(`
      SELECT b.*, u.username, r.crash_point 
      FROM bets b 
      JOIN users u ON b.user_id = u.id 
      JOIN rounds r ON b.round_id = r.id 
      ORDER BY b.created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    res.json(bets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user performance audit
router.get('/admin/users', async (req, res) => {
  try {
    const users = await all(`
      SELECT 
        u.id, 
        u.username, 
        u.balance, 
        COUNT(b.id) as total_bets,
        SUM(b.amount) as total_wagered,
        SUM(CASE WHEN b.status = 'WON' THEN b.payout ELSE 0 END) as total_won
      FROM users u
      LEFT JOIN bets b ON u.id = b.user_id
      GROUP BY u.id
      ORDER BY total_wagered DESC
    `);
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
