import PaymentProvider from '../interfaces/PaymentProvider.js';
import { PaymentStatus } from '../../../../../shared/payment-contract/payment-status.js';

export class MockPaymentProvider extends PaymentProvider {
  constructor() {
    super('MOCK');
  }

  async createPayment({ registrationId, amount, currency = 'INR', teamName, customer }) {
    const mockPaymentId = `PAY_MOCK_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const mockQrData = `upi://pay?pa=adg.sfit@sbi&pn=ADG_DECEPTION&am=${amount}&tr=${registrationId}&tn=DECEPTION_REG_${registrationId}`;

    return {
      success: true,
      paymentId: mockPaymentId,
      status: PaymentStatus.PENDING,
      method: 'MOCK_DEV',
      amount,
      currency,
      redirectUrl: null,
      qrData: mockQrData,
      upiUrl: mockQrData,
      transactionReference: null,
      message: 'Mock Payment initialized for development mode (Zero real money required)'
    };
  }

  async simulateInstantSuccess(paymentId, registrationId) {
    return {
      success: true,
      paymentId,
      registrationId,
      status: PaymentStatus.PAID,
      method: 'MOCK_DEV',
      transactionReference: `MOCK_TXN_${Date.now()}`,
      verifiedAt: new Date(),
      verifiedBy: 'DEVELOPMENT_MOCK_ENGINE'
    };
  }

  async getPaymentStatus(paymentId) {
    return {
      paymentId,
      status: PaymentStatus.PENDING,
      method: 'MOCK_DEV'
    };
  }

  async verifyWebhook(payload, signature) {
    return true;
  }
}

export default MockPaymentProvider;
