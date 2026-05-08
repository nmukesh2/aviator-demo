import express from 'express';
import { run, get, all } from '../db.js';

const router = express.Router();

// Place a bet
router.post('/bet', async (req, res) => {
  try {
    const { userId, roundId, amount, autoCashout } = req.body;
    console.log(`[BET] Attempt: user=${userId}, round=${roundId}, amount=${amount}`);

    if (!userId || !roundId || !amount) {
      console.log(`[BET] Failed: Missing fields. Body:`, req.body);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    // Check user balance
    const user = await get('SELECT balance, username FROM users WHERE id = ?', [userId]);
    if (!user) {
      console.log(`[BET] Failed: User ${userId} not found`);
      return res.status(400).json({ error: 'User not found' });
    }
    if (user.balance < amount) {
      console.log(`[BET] Failed: Insufficient balance for user ${userId}`);
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check round status
    const round = await get('SELECT status FROM rounds WHERE id = ?', [roundId]);
    if (!round) {
      console.log(`[BET] Failed: Round ${roundId} not found`);
      return res.status(400).json({ error: 'Round not found' });
    }
    console.log(`[BET] Round ${roundId} status: ${round.status}`);
    
    if (round.status === 'CRASHED') {
      return res.status(400).json({ error: 'Round already finished' });
    }

    // Check if user already has 2 bets in this round
    const bets = await all(
      'SELECT id FROM bets WHERE user_id = ? AND round_id = ?',
      [userId, roundId]
    );
    if (bets && bets.length >= 2) {
      console.log(`[BET] Failed: Max 2 bets for user ${userId} in round ${roundId}`);
      return res.status(400).json({ error: 'Maximum 2 bets allowed per round' });
    }

    // Deduct bet from balance
    await run('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, userId]);

    // Create bet record
    const result = await run(
      'INSERT INTO bets (user_id, round_id, amount, status, auto_cashout_multiplier) VALUES (?, ?, ?, ?, ?)',
      [userId, roundId, amount, 'ACTIVE', autoCashout || null]
    );

    const betData = { betId: result.lastID, userId, roundId, amount, autoCashout, username: user.username };
    console.log(`[BET] Success: betId=${result.lastID}`);
    
    if (req.broadcast) {
      req.broadcast({
        type: 'bet:placed',
        bet: betData
      });
    }

    res.json(betData);
  } catch (err) {
    console.error(`[BET] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Cashout a bet
router.post('/cashout', async (req, res) => {
  try {
    const { userId, roundId, multiplier } = req.body;

    if (!userId || !roundId || multiplier === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the bet
    const bet = await get(
      'SELECT b.*, u.username FROM bets b JOIN users u ON b.user_id = u.id WHERE b.user_id = ? AND b.round_id = ? AND b.status = ?',
      [userId, roundId, 'ACTIVE']
    );

    if (!bet) {
      return res.status(400).json({ error: 'Bet not found or already resolved' });
    }

    // Get round to check if crashed
    const round = await get('SELECT * FROM rounds WHERE id = ?', [roundId]);
    if (!round) {
      return res.status(400).json({ error: 'Round not found' });
    }

    // Check if cashout is before crash
    if (multiplier >= round.crash_point) {
      return res.status(400).json({ error: 'Crashed! Cannot cashout' });
    }

    // Calculate payout
    const payout = bet.amount * multiplier;

    // Update bet
    await run(
      'UPDATE bets SET status = ?, cashout_multiplier = ?, payout = ? WHERE id = ?',
      ['WON', multiplier, payout, bet.id]
    );

    // Add payout to balance
    await run('UPDATE users SET balance = balance + ? WHERE id = ?', [payout, userId]);

    if (req.broadcast) {
      req.broadcast({
        type: 'bet:cashed_out',
        betId: bet.id,
        userId: bet.user_id,
        username: bet.username,
        payout,
        multiplier
      });
    }

    res.json({ betId: bet.id, payout, multiplier, newBalance: (await get('SELECT balance FROM users WHERE id = ?', [userId])).balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user bets for a round
router.get('/bets/:roundId/:userId', async (req, res) => {
  try {
    const bet = await get(
      'SELECT * FROM bets WHERE user_id = ? AND round_id = ?',
      [req.params.userId, req.params.roundId]
    );
    res.json(bet || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
