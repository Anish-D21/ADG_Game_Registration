/**
 * @file PaymentService.js
 * @description Core payment coordinator & gateway boundary for Main App (Part 1)
 */

import crypto from 'crypto';
import { MockPaymentProvider } from './providers/MockPaymentProvider.js';
import { ManualUPIProvider } from './providers/ManualUPIProvider.js';
import { RazorpayStubProvider } from './providers/RazorpayStubProvider.js';
import { PaymentStatus, RegistrationStatus } from '../../../../shared/payment-contract/payment-status.js';
import { store } from '../../store/dataStore.js';
import { expectedAmountForTeamSize, totalSubmitted, isFullyPaid, maxSingleEntry, MAX_ENTRIES } from '../../utils/fees.js';
import { ticketService } from '../ticketService.js';
import { emailService } from '../emailService.js';

export class PaymentService {
  constructor() {
    this.mockProvider = new MockPaymentProvider();
    this.manualUpiProvider = new ManualUPIProvider();
    this.razorpayProvider = new RazorpayStubProvider();
  }

  getProvider(preferredMethod) {
    const mockMode = process.env.MOCK_PAYMENT === 'true';

    // In mock mode everything routes to the mock provider so the flow can be
    // exercised without money. Outside it, 'MOCK' is not an option a client can ask for.
    if (mockMode) {
      return this.mockProvider;
    }
    if (preferredMethod === 'RAZORPAY') {
      return this.razorpayProvider;
    }
    // Manual UPI is the live default: show the QR, collect the UTR, organiser verifies.
    return this.manualUpiProvider;
  }

  async createPayment({ registrationId, amount, currency = 'INR', teamName, customer, preferredMethod = 'MOCK' }) {
    const reg0 = store.registrations.find(r => r.registrationId === registrationId);
    const expected = expectedAmountForTeamSize(reg0?.teamSize);
    // The amount a client sends is only a hint for the QR; what the squad owes is
    // always derived from its size here on the server.
    amount = expected;
    const provider = this.getProvider(preferredMethod);
    const result = await provider.createPayment({ registrationId, amount, currency, teamName, customer });

    // Persist payment record
    let payment = store.payments.find(p => p.registrationId === registrationId);
    if (!payment) {
      payment = {
        _id: `pay_${Date.now()}`,
        paymentId: result.paymentId,
        registrationId,
        amount,
        amountExpected: expected,
        amountPaid: 0,
        entries: [],
        currency,
        method: preferredMethod,
        provider: provider.name,
        providerPaymentId: result.paymentId,
        transactionReference: '',
        status: result.status || PaymentStatus.PENDING,
        evidence: { url: '', publicId: '' },
        metadata: { teamName, customer },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.payments.push(payment);
    } else {
      payment.paymentId = result.paymentId;
      payment.method = preferredMethod;
      payment.status = result.status || PaymentStatus.PENDING;
      payment.updatedAt = new Date();
    }

    // Update registration payment link
    const registration = store.registrations.find(r => r.registrationId === registrationId);
    if (registration) {
      registration.paymentId = payment.paymentId;
      if (registration.status === RegistrationStatus.DRAFT || registration.status === RegistrationStatus.SUBMITTED) {
        registration.status = RegistrationStatus.PAYMENT_PENDING;
      }
    }

    store.logAudit({
      actor: customer?.email || 'STUDENT',
      action: 'PAYMENT_INITIATED',
      entity: 'Payment',
      entityId: payment.paymentId,
      metadata: { registrationId, amount, method: preferredMethod }
    });

    return {
      ...result,
      paymentRecord: payment
    };
  }

  async getPaymentByRegistrationId(registrationId) {
    return store.payments.find(p => p.registrationId === registrationId) || null;
  }

  /**
   * Record one payment a squad says it has made. Members may each submit their own
   * share, so this appends to a list rather than replacing a single reference. The
   * squad moves to verification once the submitted total covers what it owes; until
   * then it stays open so the remaining members can still pay.
   */
  async submitManualUpiEvidence({ registrationId, transactionReference, amount, payerName, contactEmail, evidenceUrl, evidencePublicId }) {
    const reg = store.registrations.find(r => r.registrationId === registrationId);
    if (!reg) {
      throw new Error(`Registration "${registrationId}" was not found.`);
    }

    // Registration IDs are sequential and guessable, so prove this submission comes
    // from the squad rather than someone counting upwards. The public lookup only
    // returns a masked email, so knowing it in full is the check.
    const claimed = String(contactEmail || '').trim().toLowerCase();
    if (!claimed || claimed !== String(reg.contactEmail || '').trim().toLowerCase()) {
      throw new Error("Enter the team leader's email address exactly as used during registration.");
    }
    const expected = expectedAmountForTeamSize(reg.teamSize);

    let payment = store.payments.find(p => p.registrationId === registrationId);
    if (!payment) {
      payment = {
        _id: `pay_${Date.now()}`,
        paymentId: `PAY_UPI_${Date.now()}`,
        registrationId,
        amount: expected,
        amountExpected: expected,
        amountPaid: 0,
        entries: [],
        currency: 'INR',
        method: 'MANUAL_UPI',
        provider: 'MANUAL_UPI',
        transactionReference: '',
        status: PaymentStatus.PENDING,
        evidence: { url: '', publicId: '' },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.payments.push(payment);
    }

    // Older records predate the entries list.
    if (!Array.isArray(payment.entries)) payment.entries = [];
    payment.amountExpected = expected;
    payment.amount = expected;

    const normalised = String(transactionReference).replace(/[\s-]/g, '');
    if (payment.entries.some(e => e.transactionReference === normalised)) {
      throw new Error(`Reference ${normalised} has already been submitted for this team.`);
    }

    const value = Math.round(Number(amount) * 100) / 100;
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('Enter the amount you paid, in rupees.');
    }
    const cap = maxSingleEntry(expected);
    if (value > cap) {
      throw new Error(
        `That amount (₹${value}) is more than this squad owes (₹${expected}). Enter only what you actually transferred.`
      );
    }
    if (payment.entries.length >= MAX_ENTRIES) {
      throw new Error(
        `This squad already has ${MAX_ENTRIES} recorded payments. Please contact the organisers rather than submitting more.`
      );
    }

    payment.entries.push({
      _id: `ent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      transactionReference: normalised,
      amount: value,
      payerName: (payerName || '').trim() || reg.leaderName || 'Team member',
      evidence: { url: evidenceUrl || '', publicId: evidencePublicId || '' },
      status: 'SUBMITTED',
      submittedAt: new Date()
    });

    payment.amountPaid = totalSubmitted(payment);
    payment.method = 'MANUAL_UPI';
    payment.transactionReference = payment.entries.map(e => e.transactionReference).join(', ');
    if (evidenceUrl) payment.evidence = { url: evidenceUrl, publicId: evidencePublicId || '' };
    payment.updatedAt = new Date();

    const covered = isFullyPaid(payment);
    payment.status = covered ? PaymentStatus.PENDING_VERIFICATION : PaymentStatus.PROCESSING;
    reg.status = covered ? RegistrationStatus.PAYMENT_VERIFICATION : RegistrationStatus.PAYMENT_PENDING;
    reg.updatedAt = new Date();

    store.logAudit({
      actor: reg.contactEmail || 'STUDENT',
      action: 'PAYMENT_EVIDENCE_SUBMITTED',
      entity: 'Payment',
      entityId: payment.paymentId,
      metadata: { registrationId, transactionReference: normalised, amount: value, paidSoFar: payment.amountPaid, expected }
    });

    if (covered) {
      await emailService.sendVerificationPendingEmail({
        to: reg.contactEmail,
        leaderName: reg.leaderName,
        teamName: reg.teamName,
        registrationId,
        transactionReference: payment.transactionReference
      });
    }

    return {
      success: true,
      status: payment.status,
      amountPaid: payment.amountPaid,
      amountExpected: expected,
      remaining: Math.max(0, expected - payment.amountPaid),
      fullyPaid: covered,
      payment
    };
  }

  async verifyAdminPayment({ paymentId, adminUser = 'ADG_ADMIN' }) {
    const payment = store.payments.find(p => p.paymentId === paymentId || p._id === paymentId);
    if (!payment) {
      throw new Error(`Payment record not found: ${paymentId}`);
    }

    // A squad only goes in once the whole team is paid for. Approving a partial
    // total would issue an entry pass for players who have not been paid for.
    payment.amountPaid = totalSubmitted(payment);
    if (!isFullyPaid(payment)) {
      const short = Number(payment.amountExpected || 0) - payment.amountPaid;
      throw new Error(
        `Cannot confirm yet: ₹${payment.amountPaid} received of ₹${payment.amountExpected} owed. Still short by ₹${short}.`
      );
    }

    if (Array.isArray(payment.entries)) {
      payment.entries.forEach(e => { if (e.status !== 'REJECTED') e.status = 'VERIFIED'; });
    }
    payment.status = PaymentStatus.PAID;
    payment.verifiedAt = new Date();
    payment.verifiedBy = adminUser;
    payment.updatedAt = new Date();

    const reg = store.registrations.find(r => r.registrationId === payment.registrationId);
    if (reg) {
      reg.status = RegistrationStatus.CONFIRMED;
      reg.updatedAt = new Date();
      await this.handlePaymentSuccessful(payment, reg);
    }

    store.logAudit({
      actor: adminUser,
      action: 'PAYMENT_VERIFIED_BY_ADMIN',
      entity: 'Payment',
      entityId: payment.paymentId,
      metadata: { registrationId: payment.registrationId, amount: payment.amount }
    });

    return { success: true, payment, registration: reg };
  }

  async rejectAdminPayment({ paymentId, reason = 'Invalid transaction reference or unverified bank screenshot', adminUser = 'ADG_ADMIN' }) {
    const payment = store.payments.find(p => p.paymentId === paymentId || p._id === paymentId);
    if (!payment) {
      throw new Error(`Payment record not found: ${paymentId}`);
    }

    payment.status = PaymentStatus.REJECTED;
    // Mark the entries rejected too, otherwise they keep counting towards the total:
    // the squad would still read "fully covered" and could be ticked straight through
    // on the next pass. A rejected squad must submit fresh evidence.
    if (Array.isArray(payment.entries)) {
      payment.entries.forEach(e => { e.status = 'REJECTED'; });
    }
    payment.amountPaid = 0;
    payment.verifiedAt = new Date();
    payment.verifiedBy = adminUser;
    payment.metadata = { ...payment.metadata, rejectionReason: reason };
    payment.updatedAt = new Date();

    const reg = store.registrations.find(r => r.registrationId === payment.registrationId);
    if (reg) {
      reg.status = RegistrationStatus.REJECTED;
      reg.notes = reason;
      reg.updatedAt = new Date();

      await emailService.sendPaymentRejectedEmail({
        to: reg.contactEmail,
        leaderName: reg.leaderName,
        teamName: reg.teamName,
        registrationId: reg.registrationId,
        reason
      });
    }

    store.logAudit({
      actor: adminUser,
      action: 'PAYMENT_REJECTED_BY_ADMIN',
      entity: 'Payment',
      entityId: payment.paymentId,
      metadata: { registrationId: payment.registrationId, reason }
    });

    return { success: true, payment, registration: reg };
  }

  /**
   * Entry point for verified gateway webhooks.
   *
   * The caller is responsible for signature verification; by the time we get here the
   * payload is trusted. This method is deliberately strict about two things the old
   * handler ignored: the amount actually captured must match what we billed, and a
   * payment already marked PAID must not run the fulfilment pipeline twice (gateways
   * retry webhooks aggressively, and a second run would issue a duplicate ticket).
   */
  async handleWebhook({ providerPaymentId, registrationId, status, transactionReference, amount }) {
    let payment = null;
    if (providerPaymentId) {
      payment = store.payments.find(p => p.providerPaymentId === providerPaymentId || p.paymentId === providerPaymentId);
    }
    if (!payment && registrationId) {
      payment = store.payments.find(p => p.registrationId === registrationId);
    }
    if (!payment) {
      throw new Error(`Webhook references an unknown payment (providerPaymentId=${providerPaymentId}, registrationId=${registrationId})`);
    }

    // Idempotency: a retried webhook for an already-settled payment is acknowledged, not reprocessed.
    if (payment.status === PaymentStatus.PAID) {
      return { success: true, duplicate: true, payment };
    }

    if (status !== PaymentStatus.PAID) {
      payment.status = status;
      payment.updatedAt = new Date();
      store.logAudit({
        actor: 'GATEWAY_WEBHOOK',
        action: `PAYMENT_WEBHOOK_${status}`,
        entity: 'Payment',
        entityId: payment.paymentId,
        metadata: { registrationId: payment.registrationId, status }
      });
      return { success: true, payment };
    }

    // Amount check: never confirm a registration on a short payment.
    if (amount !== undefined && amount !== null) {
      const expected = Number(payment.amount);
      const received = Number(amount);
      if (!Number.isFinite(received) || received !== expected) {
        payment.status = PaymentStatus.PENDING_VERIFICATION;
        payment.updatedAt = new Date();
        store.logAudit({
          actor: 'GATEWAY_WEBHOOK',
          action: 'PAYMENT_AMOUNT_MISMATCH',
          entity: 'Payment',
          entityId: payment.paymentId,
          metadata: { registrationId: payment.registrationId, expected, received }
        });
        throw new Error(`Amount mismatch for ${payment.paymentId}: expected ${expected}, received ${received}. Queued for admin review.`);
      }
    }

    payment.status = PaymentStatus.PAID;
    payment.transactionReference = transactionReference || payment.transactionReference;
    payment.providerPaymentId = providerPaymentId || payment.providerPaymentId;
    payment.verifiedAt = new Date();
    payment.verifiedBy = 'GATEWAY_WEBHOOK';
    payment.updatedAt = new Date();

    const reg = store.registrations.find(r => r.registrationId === payment.registrationId);
    if (reg) {
      reg.status = RegistrationStatus.CONFIRMED;
      reg.updatedAt = new Date();
      await this.handlePaymentSuccessful(payment, reg);
    }

    store.logAudit({
      actor: 'GATEWAY_WEBHOOK',
      action: 'PAYMENT_CONFIRMED_VIA_WEBHOOK',
      entity: 'Payment',
      entityId: payment.paymentId,
      metadata: { registrationId: payment.registrationId, amount: payment.amount, transactionReference }
    });

    return { success: true, payment, registration: reg };
  }

  /**
   * Verifies a Razorpay webhook HMAC over the exact raw bytes received.
   * Uses a constant-time compare so the secret cannot be recovered by timing the endpoint.
   */
  verifyWebhookSignature(rawBody, signature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    if (!secret) {
      return { ok: false, reason: 'RAZORPAY_WEBHOOK_SECRET is not configured' };
    }
    if (!rawBody || !signature) {
      return { ok: false, reason: 'Missing raw body or signature header' };
    }

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(String(signature), 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, reason: 'Signature mismatch' };
    }
    return { ok: true };
  }

  async simulateMockPaid({ registrationId }) {
    let payment = store.payments.find(p => p.registrationId === registrationId);
    if (!payment) {
      payment = {
        _id: `pay_${Date.now()}`,
        paymentId: `PAY_MOCK_${Date.now()}`,
        registrationId,
        amount: 500,
        currency: 'INR',
        method: 'MOCK',
        provider: 'MOCK',
        transactionReference: `MOCK_TXN_${Date.now()}`,
        status: PaymentStatus.PAID,
        verifiedAt: new Date(),
        verifiedBy: 'DEVELOPMENT_MOCK_ENGINE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.payments.push(payment);
    } else {
      payment.status = PaymentStatus.PAID;
      payment.transactionReference = `MOCK_TXN_${Date.now()}`;
      payment.verifiedAt = new Date();
      payment.verifiedBy = 'DEVELOPMENT_MOCK_ENGINE';
      payment.updatedAt = new Date();
    }

    const reg = store.registrations.find(r => r.registrationId === registrationId);
    if (reg) {
      reg.status = RegistrationStatus.CONFIRMED;
      reg.updatedAt = new Date();
      await this.handlePaymentSuccessful(payment, reg);
    }

    store.logAudit({
      actor: 'MOCK_DEV_ENGINE',
      action: 'MOCK_PAYMENT_SIMULATED_PAID',
      entity: 'Payment',
      entityId: payment.paymentId,
      metadata: { registrationId }
    });

    return { success: true, payment, registration: reg };
  }

  /**
   * Pipeline executed when payment is successfully PAID:
   * 1. Generates Registration QR Pass & Ticket
   * 2. Generates Payment Receipt / Invoice
   * 3. Dispatches Confirmation Email with details
   */
  async handlePaymentSuccessful(payment, registration) {
    try {
      // 1. Generate Ticket
      const ticket = await ticketService.generateTicket(registration);
      registration.ticketIssued = true;
      registration.ticketNumber = ticket.ticketNumber;

      // 2. Generate Invoice record
      const invoice = {
        _id: `inv_${Date.now()}`,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        registrationId: registration.registrationId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        paymentMethod: payment.method,
        transactionReference: payment.transactionReference,
        generatedAt: new Date()
      };
      store.invoices.push(invoice);

      // 3. Send Confirmation Email
      await emailService.sendConfirmationEmail({
        to: registration.contactEmail,
        leaderName: registration.leaderName,
        teamName: registration.teamName,
        registrationId: registration.registrationId,
        ticketNumber: ticket.ticketNumber,
        amount: payment.amount,
        transactionReference: payment.transactionReference
      });

      store.logAudit({
        actor: 'SYSTEM',
        action: 'REGISTRATION_CONFIRMED_POST_PAYMENT',
        entity: 'Registration',
        entityId: registration.registrationId,
        metadata: { ticketNumber: ticket.ticketNumber }
      });
    } catch (err) {
      console.error('[PaymentService] Error in post-payment pipeline:', err);
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;
