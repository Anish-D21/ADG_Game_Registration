/**
 * @file RazorpayStubProvider.js
 * @description Plug point for Part 2 Razorpay integration
 */

import PaymentProvider from '../interfaces/PaymentProvider.js';
import { PaymentStatus } from '../../../../../shared/payment-contract/payment-status.js';

export class RazorpayStubProvider extends PaymentProvider {
  constructor() {
    super('RAZORPAY');
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  }

  async createPayment({ registrationId, amount, currency = 'INR', customer }) {
    if (!this.keyId || !this.keySecret) {
      // Clean fallback stub
      return {
        success: true,
        paymentId: `order_stub_${Date.now()}`,
        status: PaymentStatus.PENDING,
        method: 'RAZORPAY_STUB',
        amount,
        currency,
        key: 'rzp_test_stub_key',
        message: 'Razorpay stub provider active. Real keys can be injected in .env without changing Main App code.'
      };
    }

    // Part 2 implementation logic fits here
    return {
      success: true,
      paymentId: `order_real_${Date.now()}`,
      status: PaymentStatus.PENDING,
      method: 'RAZORPAY'
    };
  }

  async verifyWebhook(payload, signature) {
    return true;
  }
}

export default RazorpayStubProvider;
