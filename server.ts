/**
 * @file server.ts
 * @description Master Server Entry Point (Express + Vite Middleware on Port 3000)
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './backend/src/routes/apiRoutes.js';
import { connectDB } from './backend/src/config/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Initialize DB Connection (falls back to active in-memory store if MONGO_URI is omitted)
  await connectDB();

  // 1. API Routes FIRST
  app.use('/api', apiRoutes);

  // 2. Health & Project Diagnostics Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'DECEPTION Event Registration System',
      event: 'DECEPTION - ADG x MosaIC',
      date: '16-17 Oct 2026',
      venue: 'Room No. 318',
      env: process.env.NODE_ENV || 'development'
    });
  });

  // 3. Vite Middleware for Frontend Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DECEPTION Engine] Running on http://localhost:${PORT}`);
    console.log(`[DECEPTION Engine] Ready. Theme: Among Us / Room No. 318`);
  });
}

startServer();

