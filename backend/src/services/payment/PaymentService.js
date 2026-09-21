/**
 * @file PaymentService.js
 * @description Core payment coordinator & gateway boundary for Main App (Part 1)
 */

import { MockPaymentProvider } from './providers/MockPaymentProvider.js';
import { ManualUPIProvider } from './providers/ManualUPIProvider.js';
import { RazorpayStubProvider } from './providers/RazorpayStubProvider.js';
import { PaymentStatus, RegistrationStatus } from '../../../../shared/payment-contract/payment-status.js';
import { store } from '../../store/dataStore.js';
import { ticketService } from '../ticketService.js';
import { emailService } from '../emailService.js';

export class PaymentService {
  constructor() {
    this.mockProvider = new MockPaymentProvider();
    this.manualUpiProvider = new ManualUPIProvider();
    this.razorpayProvider = new RazorpayStubProvider();
  }

  getProvider(preferredMethod) {
    if (process.env.MOCK_PAYMENT === 'true' || preferredMethod === 'MOCK') {
      return this.mockProvider;
    }
    if (preferredMethod === 'MANUAL_UPI' || preferredMethod === 'UPI') {
      return this.manualUpiProvider;
    }
    if (preferredMethod === 'RAZORPAY') {
      return this.razorpayProvider;
    }
    return this.mockProvider;
  }

  async createPayment({ registrationId, amount = 500, currency = 'INR', teamName, customer, preferredMethod = 'MOCK' }) {
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

  async submitManualUpiEvidence({ registrationId, transactionReference, evidenceUrl, evidencePublicId }) {
    let payment = store.payments.find(p => p.registrationId === registrationId);
    if (!payment) {
      payment = {
        _id: `pay_${Date.now()}`,
        paymentId: `PAY_UPI_${Date.now()}`,
        registrationId,
        amount: 500,
        currency: 'INR',
        method: 'MANUAL_UPI',
        provider: 'MANUAL_UPI',
        transactionReference,
        status: PaymentStatus.PENDING_VERIFICATION,
        evidence: { url: evidenceUrl || '', publicId: evidencePublicId || '' },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.payments.push(payment);
    } else {
      payment.method = 'MANUAL_UPI';
      payment.status = PaymentStatus.PENDING_VERIFICATION;
      payment.transactionReference = transactionReference;
      payment.evidence = { url: evidenceUrl || '', publicId: evidencePublicId || '' };
      payment.updatedAt = new Date();
    }

    const reg = store.registrations.find(r => r.registrationId === registrationId);
    if (reg) {
      reg.status = RegistrationStatus.PAYMENT_VERIFICATION;
      reg.updatedAt = new Date();
    }

    store.logAudit({
      actor: reg?.contactEmail || 'STUDENT',
      action: 'PAYMENT_EVIDENCE_SUBMITTED',
      entity: 'Payment',
      entityId: payment.paymentId,
      metadata: { registrationId, transactionReference }
    });

    // Notify student via email that verification is pending
    if (reg) {
      await emailService.sendVerificationPendingEmail({
        to: reg.contactEmail,
        leaderName: reg.leaderName,
        teamName: reg.teamName,
        registrationId,
        transactionReference
      });
    }

    return {
      success: true,
      status: PaymentStatus.PENDING_VERIFICATION,
      payment
    };
  }

  async verifyAdminPayment({ paymentId, adminUser = 'ADG_ADMIN' }) {
    const payment = store.payments.find(p => p.paymentId === paymentId || p._id === paymentId);
    if (!payment) {
      throw new Error(`Payment record not found: ${paymentId}`);
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
