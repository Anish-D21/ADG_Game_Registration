/**
 * @file payment-status.js
 * @description Standardized Payment & Registration Status Enums
 * 
 * CRITICAL ARCHITECTURAL RULE:
 * Registration Status and Payment Status MUST remain strictly decoupled.
 * The Main App normalizes all external gateway statuses into these standard keys.
 */

export const PaymentStatus = {
  NOT_STARTED: 'NOT_STARTED',
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

export const RegistrationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_VERIFICATION: 'PAYMENT_VERIFICATION',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

export const PaymentMethod = {
  MOCK: 'MOCK',
  RAZORPAY: 'RAZORPAY',
  UPI_INTENT: 'UPI_INTENT',
  UPI_QR: 'UPI_QR',
  MANUAL_UPI: 'MANUAL_UPI'
};

export default {
  PaymentStatus,
  RegistrationStatus,
  PaymentMethod
};
