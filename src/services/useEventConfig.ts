/**
 * @file useEventConfig.ts
 * @description Live event config, fetched once and shared by every page.
 *
 * `shared/eventConfig.js` is bundled into the browser at build time, so anything read
 * straight from it is frozen at the defaults. The server substitutes the real fee from
 * PER_HEAD_AMOUNT before sending this, which is why pages that display money should
 * read it here rather than importing the config directly.
 */

import { useState, useEffect } from 'react';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';
import { fetchGameInfo } from './api.ts';

export interface PaymentConfig {
  mockEnabled: boolean;
  upiVpa: string;
  payeeName: string;
  perHeadAmount: number;
  currency: string;
  minTeamAmount: number;
  maxTeamAmount: number;
}

const FALLBACK: PaymentConfig = {
  mockEnabled: false,
  upiVpa: '',
  payeeName: 'ADG DECEPTION',
  perHeadAmount: Number(EVENT_CONFIG.registrationConfig.perHeadAmount) || 100,
  currency: EVENT_CONFIG.registrationConfig.currency || 'INR',
  minTeamAmount: (Number(EVENT_CONFIG.registrationConfig.perHeadAmount) || 100) * EVENT_CONFIG.teamConfig.minPlayers,
  maxTeamAmount: (Number(EVENT_CONFIG.registrationConfig.perHeadAmount) || 100) * EVENT_CONFIG.teamConfig.maxPlayers
};

// One request per page load, shared by every component that asks.
let inflight: Promise<any> | null = null;
function load() {
  if (!inflight) {
    inflight = fetchGameInfo().catch(() => null);
  }
  return inflight;
}

export function useEventConfig() {
  const [game, setGame] = useState<any>(EVENT_CONFIG);
  const [payment, setPayment] = useState<PaymentConfig>(FALLBACK);

  useEffect(() => {
    let alive = true;
    load().then(res => {
      if (!alive || !res) return;
      if (res.game) setGame(res.game);
      if (res.paymentConfig) setPayment({ ...FALLBACK, ...res.paymentConfig });
    });
    return () => { alive = false; };
  }, []);

  /** Formats an amount the way the rest of the site shows money. */
  const money = (value: number) =>
    `${payment.currency === 'INR' ? '₹' : payment.currency + ' '}${Number(value || 0).toLocaleString('en-IN')}`;

  const amountForTeamSize = (size: number) => payment.perHeadAmount * (Number(size) || 0);

  return { game, payment, money, amountForTeamSize };
}

export default useEventConfig;
