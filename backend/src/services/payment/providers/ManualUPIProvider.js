import PaymentProvider from '../interfaces/PaymentProvider.js';
import { PaymentStatus } from '../../../../../shared/payment-contract/payment-status.js';

export class ManualUPIProvider extends PaymentProvider {
  constructor() {
    super('MANUAL_UPI');
  }

  async createPayment({ registrationId, amount, currency = 'INR', customer }) {
    const paymentId = `PAY_UPI_${Date.now()}`;
    const vpa = (process.env.UPI_VPA || '').trim();

    // A malformed or missing VPA means the QR and every deep link point at an address
    // nobody owns, and the money is simply gone. Fail loudly here instead.
    if (!/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(vpa)) {
      throw new Error(
        `UPI_VPA is not a valid UPI ID (got "${vpa || 'empty'}"). Payments are disabled until it is corrected.`
      );
    }
    const payee = process.env.UPI_PAYEE_NAME || 'ADG DECEPTION';

    // `tr` is deliberately omitted. It marks the payment as a MERCHANT transaction,
    // which makes apps expect a merchant code (mc) and a registered merchant VPA.
    // This pays a personal VPA, so a P2P intent is correct - sending tr against it
    // gets rejected with "transaction failed, try again with a new QR". A reused tr
    // is also treated as a replay. The registration ID travels in the note instead,
    // which still shows up in the bank statement narration.

    const note = `DECEPTION ${registrationId}`;

    // The amount MUST be present or most UPI apps refuse a pay intent outright.
    // The caller decides the figure, because a member may be paying only their share.
    const payable = Number(amount) > 0 ? Number(amount).toFixed(2) : null;

    const params = [
      // The VPA goes in raw. Percent-encoding the @ breaks it in most UPI apps,
      // and a VPA contains no characters that need escaping anyway.
      `pa=${vpa}`,
      `pn=${encodeURIComponent(payee)}`,
      payable ? `am=${payable}` : null,
      `cu=${encodeURIComponent(currency)}`,
      `tn=${encodeURIComponent(note)}`
    ].filter(Boolean);

    const qrUri = `upi://pay?${params.join('&')}`;

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
      payeeName: payee,
      note,
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
