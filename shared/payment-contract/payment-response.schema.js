/**
 * @file payment-response.schema.js
 * @description Standardized Payment Response Contract from Payment Service (Part 2) to Main App
 */

export const PaymentResponseSchema = {
  title: 'PaymentResponse',
  type: 'object',
  required: ['success', 'paymentId', 'status', 'amount', 'currency'],
  properties: {
    success: {
      type: 'boolean'
    },
    paymentId: {
      type: 'string',
      description: 'Internal Payment ID or Gateway Order ID'
    },
    status: {
      type: 'string',
      enum: [
        'NOT_STARTED',
        'PENDING',
        'PROCESSING',
        'PAID',
        'FAILED',
        'PENDING_VERIFICATION',
        'REJECTED',
        'CANCELLED',
        'EXPIRED'
      ]
    },
    method: {
      type: 'string',
      description: 'e.g., RAZORPAY, UPI, MANUAL_UPI, MOCK'
    },
    amount: {
      type: 'number'
    },
    currency: {
      type: 'string',
      default: 'INR'
    },
    redirectUrl: {
      type: ['string', 'null'],
      description: 'Checkout or hosted payment page link if applicable'
    },
    qrData: {
      type: ['string', 'null'],
      description: 'Raw UPI QR URI (e.g. upi://pay?pa=...) or Base64 QR Image'
    },
    upiUrl: {
      type: ['string', 'null'],
      description: 'UPI Intent deep-link for mobile app opening'
    },
    transactionReference: {
      type: ['string', 'null'],
      description: 'Bank UTR or gateway payment identifier'
    },
    evidenceUrl: {
      type: ['string', 'null'],
      description: 'Screenshot/evidence URL for manual verification'
    },
    errorMessage: {
      type: ['string', 'null']
    }
  }
};

export default {
  PaymentResponseSchema
};
