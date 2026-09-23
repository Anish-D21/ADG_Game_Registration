/**
 * @file paymentController.js
 * @description HTTP Handlers for Payment Creation, Verification & Webhook Callbacks
 */

import { paymentService } from '../services/payment/PaymentService.js';
import { store } from '../store/dataStore.js';

export async function createPaymentOrder(req, res) {
  try {
    const { registrationId, amount, currency, teamName, customer, preferredMethod } = req.body;

    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'registrationId is required' });
    }

    const result = await paymentService.createPayment({
      registrationId,
      amount,
      currency,
      teamName,
      customer,
      preferredMethod
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPaymentStatus(req, res) {
  try {
    const { registrationId } = req.params;
    const payment = await paymentService.getPaymentByRegistrationId(registrationId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found for this registration' });
    }

    return res.json({
      success: true,
      payment
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function submitManualUpi(req, res) {
  try {
    const { registrationId } = req.params;
    const { transactionReference, evidenceUrl, evidencePublicId, amount, payerName, contactEmail } = req.body;

    const utr = String(transactionReference || '').replace(/[\s\-]/g, '');
    // UPI UTR/RRN is 12 digits. Bank transaction IDs vary, so allow 12-22
    // alphanumerics as well, but reject the short junk the old check let through.
    const isUpiUtr = /^\d{12}$/.test(utr);
    const isBankRef = /^[A-Za-z0-9]{12,22}$/.test(utr);
    if (!isUpiUtr && !isBankRef) {
      return res.status(400).json({
        success: false,
        message: 'Enter the 12-digit UPI reference number (UTR) exactly as shown in your payment app.'
      });
    }

    const result = await paymentService.submitManualUpiEvidence({
      registrationId,
      transactionReference: utr,
      amount,
      payerName,
      contactEmail,
      evidenceUrl,
      evidencePublicId
    });

    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function simulateMockPayment(req, res) {
  try {
    // This endpoint marks a registration PAID without any money moving. It must be
    // unreachable in production or anyone can issue themselves a free ticket.
    if (process.env.MOCK_PAYMENT !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Mock payments are disabled. Please complete the UPI payment and submit your UTR.'
      });
    }

    const { registrationId } = req.params;
    const result = await paymentService.simulateMockPaid({ registrationId });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function handlePaymentWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature'];

  // 1. Reject anything we cannot cryptographically attribute to the gateway.
  //    Without this the endpoint is an open "mark any registration as paid" door.
  const check = paymentService.verifyWebhookSignature(req.rawBody, signature);
  if (!check.ok) {
    store.logAudit({
      actor: 'UNKNOWN',
      action: 'PAYMENT_WEBHOOK_REJECTED',
      entity: 'Payment',
      entityId: 'n/a',
      metadata: { reason: check.reason, ip: req.ip }
    });
    console.warn('[PaymentWebhook] Rejected unverified webhook:', check.reason);
    return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
  }

  try {
    const payload = req.body;
    const event = payload?.event || payload?.status || 'unknown';
    console.log('[PaymentWebhook] Verified event from gateway:', event);

    const entity = payload?.payload?.payment?.entity;
    const registrationId = entity?.notes?.registrationId || payload?.registrationId;
    const providerPaymentId = entity?.order_id || entity?.id || payload?.providerPaymentId;
    const transactionReference = entity?.id || payload?.transactionReference;
    // Razorpay reports amounts in paise; our records are in rupees.
    const amount = entity?.amount !== undefined ? Number(entity.amount) / 100 : payload?.amount;

    let status = null;
    if (payload?.event === 'payment.captured' || payload?.status === 'PAID') {
      status = 'PAID';
    } else if (payload?.event === 'payment.failed' || payload?.status === 'FAILED') {
      status = 'FAILED';
    }

    if (!status) {
      // Acknowledge unhandled event types so the gateway stops retrying them.
      return res.json({ success: true, received: true, ignored: event });
    }

    const result = await paymentService.handleWebhook({
      providerPaymentId,
      registrationId,
      status,
      transactionReference,
      amount
    });

    return res.json({ success: true, received: true, duplicate: result.duplicate || false });
  } catch (err) {
    console.error('[PaymentWebhook] Processing error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
}
