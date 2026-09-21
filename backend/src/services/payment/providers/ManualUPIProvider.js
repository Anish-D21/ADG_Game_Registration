import PaymentProvider from '../interfaces/PaymentProvider.js';
import { PaymentStatus } from '../../../../../shared/payment-contract/payment-status.js';

export class ManualUPIProvider extends PaymentProvider {
  constructor() {
    super('MANUAL_UPI');
  }

  async createPayment({ registrationId, amount, currency = 'INR', customer }) {
    const paymentId = `PAY_UPI_${Date.now()}`;
    const vpa = 'adg.deception@sbi';
    const qrUri = `upi://pay?pa=${vpa}&pn=ADG%20DECEPTION&am=${amount}&cu=${currency}&tr=${registrationId}`;

    return {
      success: true,
      paymentId,
      status: PaymentStatus.PENDING,
      method: 'MANUAL_UPI',
      amount,
      currency,
      qrData: qrUri,
      upiUrl: qrUri,
      vpa,
      instructions: 'Scan the UPI QR code using Google Pay, PhonePe, or Paytm, complete the payment of INR 500, and submit the 12-digit UTR transaction reference number.'
    };
  }

  async submitEvidence({ registrationId, paymentId, transactionReference, evidenceUrl, evidencePublicId }) {
    return {
      success: true,
      registrationId,
      paymentId,
      status: PaymentStatus.PENDING_VERIFICATION,
      method: 'MANUAL_UPI',
      transactionReference,
      evidenceUrl,
      evidencePublicId,
      message: 'Payment verification submitted. Your transaction reference is awaiting verification by the ADG Admin team.'
    };
  }
}

export default ManualUPIProvider;
