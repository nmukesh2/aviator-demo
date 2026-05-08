# 🚀 Free Deployment Guide: Aviator Demo

Follow these steps to host your game online for free so your friends can play from their mobile phones anywhere in the world.

---

## 1. Push Code to GitHub
You must have your code on GitHub to use the free hosting services.
1. Create a repository on [GitHub](https://github.com) named `aviator-demo`.
2. In your local project folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ready for deployment"
   git remote add origin https://github.com/YOUR_USERNAME/aviator-demo.git
   git push -u origin main
   ```

---

## 2. Deploy Backend (Render.com)
Render will host your Node.js API and SQLite database for free.
1. Sign up at [Render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your `aviator-demo` GitHub repository.
4. **Configure Settings:**
   - **Name:** `aviator-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
5. **Add Environment Variables (Advanced):**
   - `PORT` = `10000`
   - `NODE_ENV` = `production`
6. Click **Create Web Service**.
7. **Copy your URL:** Once deployed, you will see a link like `https://aviator-backend.onrender.com`.

---

## 3. Deploy Frontend (Vercel.com)
Vercel is specialized for high-performance React/Vite apps.
1. Sign up at [Vercel.com](https://vercel.com).
2. Click **Add New** > **Project**.
3. Connect the same `aviator-demo` GitHub repository.
4. **Configure Settings:**
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
5. **Environment Variables (CRITICAL):**
   - Name: `VITE_API_URL`
   - Value: (Paste your **Render URL** from Step 2, e.g., `https://aviator-backend.onrender.com`)
6. Click **Deploy**.
7. **Mobile Testing:** Vercel will give you a link like `https://aviator-demo.vercel.app`. Send this to your friends!

---

## 📱 Mobile-Friendly Features
The application is already optimized for mobile devices:
- **Responsive Layout:** Automatically adjusts for iPhone/Android screens.
- **Touch Targets:** Large, easy-to-click buttons for betting and cashouts.
- **WebSocket:** Uses secure `wss://` automatically via Render's HTTPS for real-time multiplier updates.

## ⚠️ Important Free Tier Notes
1. **Cold Starts:** If the backend hasn't been used for 15 minutes, it "goes to sleep." The first person to open the site may wait 30-60 seconds for the server to wake up.
2. **Database:** The `game.db` is local to the server. If Render restarts the server, user balances may reset to $1000. For permanent storage, you would eventually need a "Render Disk" (which costs ~$7/mo) or an external database like MongoDB/Supabase.

---
*Created by Gemini CLI - May 2026*
