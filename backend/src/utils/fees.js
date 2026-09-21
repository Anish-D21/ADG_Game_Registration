/**
 * @file fees.js
 * @description Single source of truth for what a squad owes.
 *
 * The fee is per participant, so the expected total follows team size: five players
 * owe 5x the per-head rate, six players owe 6x. Members may each pay their own share
 * or one person may cover everyone - the total is what matters, not how it arrives.
 */

import { EVENT_CONFIG } from '../../../shared/eventConfig.js';

/**
 * The fee lives in PER_HEAD_AMOUNT in the environment. eventConfig only supplies a
 * fallback, so changing that one variable changes it everywhere: the expected total,
 * the approval threshold, the rules text and the FAQ.
 */
export function perHeadAmount() {
  const fromEnv = Number(process.env.PER_HEAD_AMOUNT);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  return Number(EVENT_CONFIG.registrationConfig.perHeadAmount) || 100;
}

export function currency() {
  return process.env.CURRENCY || EVENT_CONFIG.registrationConfig.currency || 'INR';
}

export function expectedAmountForTeamSize(teamSize) {
  const size = Number(teamSize);
  if (!Number.isFinite(size) || size <= 0) return perHeadAmount();
  return perHeadAmount() * size;
}

/** Sum of the entries an organiser has not rejected. */
export function totalSubmitted(payment) {
  if (!payment || !Array.isArray(payment.entries)) return 0;
  return payment.entries
    .filter(e => e.status !== 'REJECTED')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

export function isFullyPaid(payment) {
  if (!payment) return false;
  return totalSubmitted(payment) >= Number(payment.amountExpected || 0);
}

export default { perHeadAmount, currency, expectedAmountForTeamSize, totalSubmitted, isFullyPaid };
