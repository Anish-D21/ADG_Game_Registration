/**
 * @file server.ts
 * @description Master Server Entry Point (Express + Vite Middleware on Port 3000)
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './backend/src/routes/apiRoutes.js';
import { connectDB } from './backend/src/config/db.js';
import { store } from './backend/src/store/dataStore.js';
import {
  hydrate, flush, markDirty, isEnabled, startPeriodicFlush, stopPeriodicFlush
} from './backend/src/store/persistence.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middlewares
  app.use(cors());
  // Retain the raw request bytes so gateway webhook signatures can be verified.
  // Express parses the body into an object, but HMAC must run over the exact payload sent.
  app.use(express.json({
    limit: '15mb',
    verify: (req: any, _res, buf: Buffer) => { req.rawBody = buf; }
  }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Initialize DB Connection (falls back to active in-memory store if MONGO_URI is omitted)
  await connectDB();

  // Load any previously saved data back into the working set.
  const { enabled: persistent, loaded } = await hydrate(store);
  if (persistent) {
    const summary = Object.entries(loaded).map(([k, v]) => `${k}=${v}`).join(' ') || 'empty database';
    console.log(`[Persistence] Restored from MongoDB: ${summary}`);
    startPeriodicFlush(store);
  } else {
    console.warn('[Persistence] No database connected - data will be LOST on restart.');
  }

  // Surface a broken payment configuration at boot rather than when a student
  // reaches the payment step and finds a QR pointing nowhere.
  if (process.env.MOCK_PAYMENT !== 'true') {
    const vpa = (process.env.UPI_VPA || '').trim();
    if (!/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(vpa)) {
      console.error(`[Payments] UPI_VPA is missing or malformed ("${vpa || 'empty'}"). Students will NOT be able to pay.`);
    } else {
      console.log(`[Payments] Live UPI payments to ${vpa}`);
    }
  }

  // Anything that is not a read may have changed the store, so write it back once the
  // response is on its way out. This is what makes a restart non-destructive.
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.on('finish', () => {
        markDirty();
        flush(store);
      });
    }
    next();
  });

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

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DECEPTION Engine] Running on http://localhost:${PORT}`);
    console.log(`[DECEPTION Engine] Ready. Theme: Among Us / Room No. 318`);
  });

  // Render sends SIGTERM before recycling an instance; persist before we lose the process.
  const shutdown = async (signal: string) => {
    console.log(`[DECEPTION Engine] ${signal} received - saving before exit.`);
    stopPeriodicFlush();
    if (isEnabled()) {
      await flush(store, { force: true });
      console.log('[Persistence] Final save complete.');
    }
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();

