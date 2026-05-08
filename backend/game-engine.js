import { run, get, all } from './db.js';
import crypto from 'crypto';

export class GameEngine {
  constructor(broadcast) {
    this.broadcast = broadcast;
    this.currentRound = null;
    this.roundInterval = null;
    this.tickInterval = null;
    this.TICK_RATE = 50; // Update multiplier every 50ms
    this.WAIT_TIME = 5000; // 5 seconds between rounds
    this.bots = ['Lucky_Jet', 'Aviator_King', 'SkyHigh', 'Pilot_007', 'Turbo_Bet', 'HighFlyer', 'WinCloud', 'RocketMan', 'JetSet', 'Cloud9'];
  }

  start() {
    this.prepareNextRound();
  }

  async prepareNextRound() {
    const { crashPoint, seed, hash } = this.generateProvablyFairPoint();
    
    const result = await run(
      'INSERT INTO rounds (crash_point, seed, hash, status, created_at) VALUES (?, ?, ?, ?, ?)',
      [crashPoint, seed, hash, 'WAITING', new Date().toISOString()]
    );

    this.currentRound = {
      id: result.lastID,
      crashPoint,
      hash,
      status: 'WAITING',
      startTime: Date.now() + this.WAIT_TIME,
      waitTime: this.WAIT_TIME
    };

    this.broadcast({
      type: 'round:waiting',
      id: this.currentRound.id,
      waitTime: this.WAIT_TIME,
      startTime: this.currentRound.startTime
    });

    // Simulate bot bets during waiting phase
    this.simulateBots();

    setTimeout(() => this.startNewRound(), this.WAIT_TIME);
  }

  simulateBots() {
    const numBots = Math.floor(Math.random() * 8) + 5;
    for (let i = 0; i < numBots; i++) {
      setTimeout(() => {
        if (this.currentRound?.status !== 'WAITING') return;
        const botName = this.bots[Math.floor(Math.random() * this.bots.length)];
        const amount = [1, 2, 5, 10, 20, 50, 100][Math.floor(Math.random() * 7)];
        
        this.broadcast({
          type: 'bet:placed',
          bet: {
            betId: 'bot_' + Math.random().toString(36).substr(2, 9),
            username: botName,
            amount,
            isBot: true
          }
        });
      }, Math.random() * (this.WAIT_TIME - 1000));
    }
  }

  async startNewRound() {
    if (!this.currentRound) return;

    await run(
      'UPDATE rounds SET status = ?, started_at = ? WHERE id = ?',
      ['FLYING', new Date().toISOString(), this.currentRound.id]
    );

    this.currentRound.status = 'FLYING';
    this.currentRound.startTime = Date.now();
    this.currentRound.multiplier = 1.0;

    this.broadcast({
      type: 'round:started',
      round: {
        id: this.currentRound.id,
        status: 'FLYING',
        startTime: this.currentRound.startTime,
        hash: this.currentRound.hash
      }
    });

    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => this.tickMultiplier(), this.TICK_RATE);
  }

  generateProvablyFairPoint() {
    // 1. Generate cryptographically secure seed
    const seed = crypto.randomBytes(32).toString('hex');
    
    // 2. Use HMAC with a secret salt to make it impossible to crack without the backend key
    const secretSalt = process.env.GAME_SECRET || 'super_secret_house_key_2026';
    const hash = crypto.createHmac('sha256', secretSalt).update(seed).digest('hex');
    
    // 3. Convert first 13 hex characters (52 bits) to a float between 0 and 1
    const h = parseInt(hash.slice(0, 13), 16);
    const e = Math.pow(2, 52);
    const rand = h / e; // [0, 1)

    // 4. Increase house edge to 8% (Admin profits more)
    const houseEdge = 0.08;
    let crashPoint;

    // 5. Harder algorithm: Instant crash if rand < houseEdge
    if (rand < houseEdge) {
      crashPoint = 1.00;
    } else {
      // Calculate multiplier
      crashPoint = (1 - houseEdge) / (1 - rand);
    }
    
    // 6. Cap maximum multiplier to prevent extreme isolated payouts
    const maxMultiplier = 100.00;
    crashPoint = Math.min(crashPoint, maxMultiplier);
    
    return {
      crashPoint: Math.max(1.0, parseFloat(crashPoint.toFixed(2))),
      seed,
      hash
    };
  }

  async tickMultiplier() {
    if (!this.currentRound || this.currentRound.status !== 'FLYING') return;

    const elapsed = (Date.now() - this.currentRound.startTime) / 1000;
    const multiplier = Math.pow(1.08, elapsed);

    if (multiplier >= this.currentRound.crashPoint) {
      this.crashRound();
      return;
    }

    this.currentRound.multiplier = multiplier;

    // Check for auto-cashouts
    const autoBets = await all(
      'SELECT b.*, u.username FROM bets b JOIN users u ON b.user_id = u.id WHERE b.round_id = ? AND b.status = ? AND b.auto_cashout_multiplier IS NOT NULL AND b.auto_cashout_multiplier <= ?',
      [this.currentRound.id, 'ACTIVE', multiplier]
    );

    for (const bet of autoBets) {
      const payout = bet.amount * bet.auto_cashout_multiplier;
      await run(
        'UPDATE bets SET status = ?, cashout_multiplier = ?, payout = ? WHERE id = ?',
        ['WON', bet.auto_cashout_multiplier, payout, bet.id]
      );
      await run('UPDATE users SET balance = balance + ? WHERE id = ?', [payout, bet.user_id]);
      
      this.broadcast({
        type: 'bet:cashed_out',
        betId: bet.id,
        userId: bet.user_id,
        username: bet.username,
        payout,
        multiplier: bet.auto_cashout_multiplier
      });
    }

    this.broadcast({
      type: 'round:flying',
      multiplier: parseFloat(multiplier.toFixed(2)),
      roundId: this.currentRound.id
    });
  }

  async crashRound() {
    if (!this.currentRound || this.currentRound.status === 'CRASHED') return;

    const crashPoint = this.currentRound.crashPoint;
    this.currentRound.status = 'CRASHED';

    await run('UPDATE rounds SET status = ?, crashed_at = ? WHERE id = ?', 
      ['CRASHED', new Date().toISOString(), this.currentRound.id]);

    // Resolve all ACTIVE bets
    const bets = await all('SELECT * FROM bets WHERE round_id = ? AND status = ?', 
      [this.currentRound.id, 'ACTIVE']);

    for (const bet of bets) {
      await run('UPDATE bets SET status = ? WHERE id = ?', ['LOST', bet.id]);
    }

    clearInterval(this.tickInterval);

    this.broadcast({
      type: 'round:crashed',
      crashPoint,
      roundId: this.currentRound.id
    });

    // Wait and start next round
    setTimeout(() => this.prepareNextRound(), 3000);
  }

  getCurrentRound() {
    return this.currentRound;
  }
}

export default GameEngine;
