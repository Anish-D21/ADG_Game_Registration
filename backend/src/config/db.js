import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.trim() === '') {
    console.log('[Database] No MONGO_URI provided in environment. Running in active in-memory store mode (Zero-setup Part 1 development).');
    return false;
  }

  if (isConnected) {
    return true;
  }

  // A transient blip - a network change, a DNS hiccup - should not decide the fate of
  // the event's data, so retry before giving up.
  const ATTEMPTS = 5;
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
      isConnected = true;
      console.log(`[Database] MongoDB connected${attempt > 1 ? ` (attempt ${attempt})` : ''}.`);
      return true;
    } catch (error) {
      lastError = error;
      console.warn(`[Database] Connection attempt ${attempt}/${ATTEMPTS} failed: ${error.message.split('\n')[0]}`);
      if (attempt < ATTEMPTS) {
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }
  }

  // Refuse to run. Starting anyway would serve an empty database: existing squads
  // would read as "not found", and new registrations would be accepted into memory
  // and lost on the next restart. A process that will not start is obvious and
  // recoverable; one that quietly forgets everything is neither.
  console.error('');
  console.error('[Database] FATAL: MONGO_URI is configured but unreachable after ' + ATTEMPTS + ' attempts.');
  console.error('[Database] Refusing to start - running without it would drop every registration.');
  console.error('[Database] Check: Atlas IP access list includes 0.0.0.0/0, the cluster is not paused,');
  console.error('[Database] and the username/password in MONGO_URI are correct.');
  console.error('[Database] Last error: ' + (lastError?.message || 'unknown'));
  console.error('');
  process.exit(1);
}

export default connectDB;
