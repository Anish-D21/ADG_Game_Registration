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
    const { transactionReference, evidenceUrl, evidencePublicId } = req.body;

    if (!transactionReference || transactionReference.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A valid 12-digit UPI UTR number or bank transaction ID is required.'
      });
    }

    const result = await paymentService.submitManualUpiEvidence({
      registrationId,
      transactionReference: transactionReference.trim(),
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
    const { registrationId } = req.params;
    const result = await paymentService.simulateMockPaid({ registrationId });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function handlePaymentWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature'];
    const payload = req.body;

    console.log('[PaymentWebhook] Received event from gateway:', payload?.event || 'Unknown');

    // Standardized processing
    if (payload?.event === 'payment.captured' || payload?.status === 'PAID') {
      const regId = payload?.payload?.payment?.entity?.notes?.registrationId || payload?.registrationId;
      if (regId) {
        await paymentService.simulateMockPaid({ registrationId: regId });
      }
    }

    return res.json({ success: true, received: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}
