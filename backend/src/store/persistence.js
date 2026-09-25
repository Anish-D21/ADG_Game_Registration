/**
 * @file persistence.js
 * @description Durable backing for the in-memory store.
 *
 * The services all work against `store` synchronously (`store.payments.find(...)`,
 * `payment.status = 'PAID'`). Rewriting every call site to async Mongoose would be a
 * large, risky change for a dataset of a few hundred documents, so instead the whole
 * working set is loaded into memory at boot and written back to MongoDB whenever it
 * changes. Reads stay instant; the database is the durable copy that survives a restart.
 *
 * Writes are flushed at request boundaries (see server.ts), on a periodic safety timer,
 * and on shutdown, so the worst case loss is an in-flight request rather than everything.
 */

import mongoose from 'mongoose';
import { hashPassword, verifyPassword } from '../utils/password.js';

// Every array on the store that needs to outlive the process.
export const COLLECTIONS = [
  'games', 'students', 'teams', 'teamMembers', 'registrations',
  'payments', 'documents', 'tickets', 'invoices', 'admins', 'auditLogs'
];

const META = '_meta';

let enabled = false;
let dirty = false;
let timer = null;
// The flush currently in flight, if any. Callers await it rather than being turned
// away: a shutdown that returns early while a write is still travelling to Atlas
// reports success and then kills the very write it was supposed to wait for.
let inFlight = null;

export function isEnabled() {
  return enabled;
}

export function markDirty() {
  dirty = true;
}

function db() {
  return mongoose.connection.db;
}

/**
 * Pull everything out of MongoDB into the store. A collection that is empty in the
 * database leaves whatever the store bootstrapped in memory (the game record and the
 * default admin), so a first run still works.
 */
export async function hydrate(store) {
  if (mongoose.connection.readyState !== 1) {
    enabled = false;
    return { enabled: false, loaded: {} };
  }
  enabled = true;

  const loaded = {};
  for (const name of COLLECTIONS) {
    const docs = await db().collection(name).find({}).toArray();
    if (docs.length > 0) {
      // Strip the driver's own _id handling: our records carry their own string _id.
      store[name] = docs.map(({ __mongoId, ...rest }) => rest);
      loaded[name] = docs.length;
    }
  }

  migrateLegacyPayments(store);
  applyAdminPasswordFromEnv(store);

  const meta = await db().collection(META).findOne({ _id: 'counters' });
  if (meta && Number.isFinite(meta.registrationCounter)) {
    store.registrationCounter = meta.registrationCounter;
  }
  // Guard against a counter that trails the records actually present.
  store.syncRegistrationCounter();

  return { enabled: true, loaded };
}

/**
 * Make ADMIN_PASSWORD authoritative on every boot.
 *
 * The admin row is persisted, so hydrate() replaces the account seeded at startup
 * with the stored one - including its old password hash. Without this, setting
 * ADMIN_PASSWORD on the host appears to work but changes nothing, and the account
 * silently keeps whatever password it was first created with. For the one account
 * that approves payments and can export every participant's details, failing closed
 * like that is worse than useless.
 */
function applyAdminPasswordFromEnv(store) {
  const desired = process.env.ADMIN_PASSWORD;
  if (!desired) return;

  let changed = 0;
  for (const admin of store.admins || []) {
    if (admin.email?.toLowerCase() !== 'admin@adg.org') continue;
    if (verifyPassword(desired, admin.passwordHash)) continue;
    admin.passwordHash = hashPassword(desired);
    admin.updatedAt = new Date();
    changed++;
  }
  if (changed > 0) {
    console.log('[Auth] Admin password updated from ADMIN_PASSWORD.');
    markDirty();
  }
}

/**
 * Payments written before the per-entry ledger existed carry a single
 * transactionReference and a flat amount. Fold those into one entry so the desk shows
 * them as paid rather than stranding the squad at zero with no way to approve it.
 */
function migrateLegacyPayments(store) {
  let migrated = 0;
  for (const p of store.payments || []) {
    if (Array.isArray(p.entries) && p.entries.length > 0) continue;
    if (!p.entries) p.entries = [];
    if (!p.transactionReference) continue;

    for (const ref of String(p.transactionReference).split(',').map(r => r.trim()).filter(Boolean)) {
      p.entries.push({
        _id: `ent_legacy_${ref}`,
        transactionReference: ref,
        amount: Number(p.amount) || 0,
        payerName: 'Recorded before itemised payments',
        evidence: p.evidence || { url: '', publicId: '' },
        status: p.status === 'PAID' ? 'VERIFIED' : 'SUBMITTED',
        submittedAt: p.updatedAt || p.createdAt || new Date()
      });
      migrated++;
      break; // the flat amount covers the whole record, not each reference
    }
  }
  if (migrated > 0) {
    console.log(`[Persistence] Folded ${migrated} pre-ledger payment(s) into itemised entries.`);
    markDirty();
  }
}

/**
 * Write the working set back. Upserts by _id rather than replacing collections, so an
 * interrupted flush can never leave the database empty. Nothing in the app deletes
 * records, so there is no tombstone handling to do.
 */
export async function flush(store, { force = false } = {}) {
  if (!enabled) return false;

  // Coalesce: if a save is already running, wait for it, then run once more so any
  // change made during it is included. Never return while writes are outstanding.
  if (inFlight) {
    await inFlight;
    if (!dirty && !force) return true;
  }
  if (!dirty && !force) return false;

  const run = (async () => {
    dirty = false;
    try {
      for (const name of COLLECTIONS) {
        const rows = store[name];
        if (!Array.isArray(rows) || rows.length === 0) continue;

        const ops = rows.map(doc => ({
          replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true }
        }));
        await db().collection(name).bulkWrite(ops, { ordered: false });
      }

      await db().collection(META).replaceOne(
        { _id: 'counters' },
        { _id: 'counters', registrationCounter: store.registrationCounter, updatedAt: new Date() },
        { upsert: true }
      );
      return true;
    } catch (err) {
      // Re-arm so the next opportunity retries rather than silently dropping the change.
      dirty = true;
      console.error('[Persistence] Flush failed:', err.message);
      return false;
    }
  })();

  inFlight = run;
  try {
    return await run;
  } finally {
    if (inFlight === run) inFlight = null;
  }
}

/** Safety net for mutations that happen outside a request (timers, webhooks retried late). */
export function startPeriodicFlush(store, intervalMs = 15000) {
  if (!enabled || timer) return;
  timer = setInterval(() => { flush(store); }, intervalMs);
  timer.unref?.();
}

export function stopPeriodicFlush() {
  if (timer) { clearInterval(timer); timer = null; }
}

export default { hydrate, flush, markDirty, isEnabled, startPeriodicFlush, stopPeriodicFlush, COLLECTIONS };
