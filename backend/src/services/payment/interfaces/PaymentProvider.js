/**
 * @file PaymentProvider.js
 * @description Abstract Base Interface for Payment Gateway Providers
 */

export class PaymentProvider {
  constructor(providerName) {
    if (new.target === PaymentProvider) {
      throw new TypeError('Cannot construct abstract PaymentProvider directly');
    }
    this.name = providerName;
  }

  /**
   * Initialize or create a payment order
   * @param {Object} params - { registrationId, amount, currency, teamName, customer, metadata }
   * @returns {Promise<Object>} Normalized PaymentResponse
   */
  async createPayment(params) {
    throw new Error('Method createPayment() must be implemented');
  }

  /**
   * Verify status of payment by paymentId/orderId
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async getPaymentStatus(paymentId) {
    throw new Error('Method getPaymentStatus() must be implemented');
  }

  /**
   * Verify manual or automated webhook signature
   */
  async verifyWebhook(payload, signature) {
    throw new Error('Method verifyWebhook() must be implemented');
  }
}

export default PaymentProvider;
