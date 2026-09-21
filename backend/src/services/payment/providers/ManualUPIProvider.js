import PaymentProvider from '../interfaces/PaymentProvider.js';
import { PaymentStatus } from '../../../../../shared/payment-contract/payment-status.js';

export class ManualUPIProvider extends PaymentProvider {
  constructor() {
    super('MANUAL_UPI');
  }

  async createPayment({ registrationId, amount, currency = 'INR', customer }) {
    const paymentId = `PAY_UPI_${Date.now()}`;
    const vpa = process.env.UPI_VPA || 'adg.deception@sbi';
    const payee = encodeURIComponent(process.env.UPI_PAYEE_NAME || 'ADG DECEPTION');
    // tn (note) and tr (reference) both carry the registration ID so the payment is
    // identifiable in the bank statement when the organiser reconciles.
    // No amount is pre-filled: members may be paying their own share rather than the
    // squad total, so the payer types the figure. The registration ID still rides along
    // as the reference so the credit is identifiable in the bank statement.
    const qrUri = `upi://pay?pa=${vpa}&pn=${payee}&cu=${currency}&tr=${registrationId}&tn=${encodeURIComponent('DECEPTION ' + registrationId)}`;

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
      payeeName: process.env.UPI_PAYEE_NAME || 'ADG DECEPTION',
      instructions: `Scan the QR with any UPI app, pay your share (or the full squad amount), then submit the 12-digit UTR reference along with how much you paid. Each member who pays should submit their own reference.`
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
