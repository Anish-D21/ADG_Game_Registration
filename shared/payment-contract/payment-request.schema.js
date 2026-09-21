/**
 * @file payment-request.schema.js
 * @description Formal API Request Schema from Main App to Payment Module (Part 2)
 */

export const CreatePaymentRequestSchema = {
  title: 'CreatePaymentRequest',
  type: 'object',
  required: ['registrationId', 'amount', 'currency', 'teamName', 'customer'],
  properties: {
    registrationId: {
      type: 'string',
      description: 'Human-readable unique registration code, e.g., GAME26-00125'
    },
    amount: {
      type: 'number',
      minimum: 1,
      description: 'Total registration fee in minor or major currency units (specified in config)'
    },
    currency: {
      type: 'string',
      default: 'INR',
      description: 'ISO 4217 Currency Code'
    },
    teamName: {
      type: 'string',
      description: 'Registered team name'
    },
    customer: {
      type: 'object',
      required: ['name', 'email', 'mobile'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        mobile: { type: 'string' }
      }
    },
    preferredMethod: {
      type: 'string',
      enum: ['RAZORPAY', 'UPI_QR', 'UPI_INTENT', 'MANUAL_UPI', 'MOCK']
    },
    metadata: {
      type: 'object',
      description: 'Pass-through metadata preserved across callbacks'
    }
  }
};

export const ManualUpiSubmissionSchema = {
  title: 'ManualUpiSubmission',
  type: 'object',
  required: ['registrationId', 'transactionReference'],
  properties: {
    registrationId: { type: 'string' },
    transactionReference: {
      type: 'string',
      description: '12-digit UPI UTR number or bank transaction ID'
    },
    evidenceUrl: {
      type: 'string',
      description: 'Cloudinary or storage URL of the payment screenshot'
    },
    evidencePublicId: {
      type: 'string'
    },
    amount: { type: 'number' }
  }
};

export default {
  CreatePaymentRequestSchema,
  ManualUpiSubmissionSchema
};
