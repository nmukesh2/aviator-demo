# Aviator Game Demo

A production-looking Aviator crash casino game built in React + Node.js + WebSocket. 2-day MVP.

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Start Backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Start Frontend (in a new terminal)

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Open in Browser

Go to `http://localhost:5173`

## How to Play

1. **Select a player** from the "Players Online" section to switch accounts
2. **Enter a bet amount** (min $1)
3. **Place Bet** when a new round starts
4. **Watch the multiplier climb** live
5. **Cash Out** before it crashes to win!
6. **Lose your bet** if you don't cash out in time

## Architecture

### Backend (`/backend`)
- **Express.js** — REST API server
- **WebSocket** — Real-time multiplier broadcasting
- **SQLite** — Lightweight database (file-based)
- **Game Engine** — Automatic round loop & crash generation

**API Endpoints:**
- `GET /api/health` — Server status
- `GET /api/users` — List all players
- `GET /api/balance/:userId` — Get user balance
- `POST /api/create-user` — Create new test user
- `POST /api/bet` — Place a bet
- `POST /api/cashout` — Cash out from a bet
- `GET /api/bets/:roundId/:userId` — Get bet info

**WebSocket Events:**
- `round:started` — New round begins
- `round:flying` — Live multiplier update (~every 50ms)
- `round:crashed` — Round crashed

### Frontend (`/frontend`)
- **React 18** — UI components
- **Vite** — Fast build tool
- **Tailwind CSS** — Styling
- **Recharts** — Multiplier chart visualization
- **WebSocket** — Real-time connection to backend

## Features

✅ Real-time multiplayer (all players see same round)
✅ Live multiplier chart
✅ Instant bet placement & cashout
✅ Balance tracking per player
✅ Player switching for demo/testing
✅ Responsive design (mobile-friendly)
✅ Fake currency (no real payments)
✅ Auto-reconnect on disconnect

## Project Structure

```
aviator-demo/
├── backend/
│   ├── index.js              — Express + WebSocket server
│   ├── db.js                 — SQLite setup & queries
│   ├── game-engine.js        — Round loop & crash logic
│   ├── routes/
│   │   ├── users.js
│   │   └── bets.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── GameScreen.jsx
│   │   │   ├── MultiplierChart.jsx
│   │   │   └── UserSelector.jsx
│   │   └── hooks/
│   │       └── useWebSocket.js
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env
└── .gitignore
```

## Deployment

### Deploy Backend (Railway / Render)

1. Push to GitHub
2. Connect repo to Railway/Render
3. Set env: `PORT=5000`, `NODE_ENV=production`
4. Note the deployment URL (e.g., `https://aviator-backend.railway.app`)

### Deploy Frontend (Vercel)

1. Build: `npm run build`
2. Push to GitHub
3. Connect repo to Vercel
4. Set env: `VITE_API_URL=https://aviator-backend.railway.app`
5. Deploy — instant on Vercel

## Notes

- **Demo only** — Not production-ready, no auth security, fake currency
- **Single server** — No load balancing, SQLite only
- **Simplified multiplayer** — All players see same crash point, bets resolved server-side
- **No regulatory compliance** — This is a demo, not a real casino app
- **Animations** — Minimal to prioritize speed; add Framer Motion for polish later

## Next Steps (Post-MVP)

- Mobile app (React Native)
- Real payment processing (Stripe/crypto)
- Admin dashboard
- User authentication (JWT)
- Leaderboards & chat
- Sound effects & animations
- Responsible gaming features
- KYC/AML compliance
