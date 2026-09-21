# PAYMENT INTEGRATION CONTRACT & HANDOFF GUIDE

**Project:** DECEPTION - Event Registration System  
**Organization:** AI DEVELOPERS GROUP (ADG) x MosaIC  
**Event Date:** 16–17 October 2026 | **Venue:** Room No. 318  
**Architecture:** Part 1 (Main App) & Part 2 (Payment Service)

---

## 1. Overview & Separation of Concerns

The registration system is architected with a strict separation between **Part 1 (Registration Core)** and **Part 2 (Payment Service)**:

- **PART 1 (This Repository):**
  - Owns public game information, team registration, SFIT student validation (`@student.sfit.ac.in`), ID card uploads, 5–6 player constraints, registration records, Admin verification UI, QR ticket generation, receipts, email notifications, and Excel exports.
  - **Does NOT** contain hardcoded Razorpay SDK or banking vendor calls.
  - Communicates strictly with a normalized `PaymentService` interface.

- **PART 2 (Your Responsibilities):**
  - Implement the actual payment gateway (Razorpay, Cashfree, UPI QR, or Manual UPI verification).
  - Handle gateway keys/secrets, webhooks, checkout popups/deep links, bank UTR verification, and refund flows.
  - Return normalized statuses defined below to Part 1.

---

## 2. Standard Status Enum (Contract)

The Main App **only** accepts these normalized statuses:

| Status Key             | Meaning                                     | Main App Action                                                                                         |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `NOT_STARTED`          | Payment has not been initiated              | Registration in `PAYMENT_PENDING`                                                                       |
| `PENDING`              | Order created at gateway, waiting for payer | Display checkout/QR                                                                                     |
| `PROCESSING`           | Payer submitted, awaiting bank confirmation | Polling / loading                                                                                       |
| `PAID`                 | Funds successfully captured & verified      | Automatically sets Registration to `CONFIRMED`, triggers QR ticket PDF, receipt, and confirmation email |
| `PENDING_VERIFICATION` | Payer submitted UTR/screenshot (Manual UPI) | Registration in `PAYMENT_VERIFICATION`, moves to Admin Queue                                            |
| `FAILED`               | Payment failed or bank rejected             | Payer can retry                                                                                         |
| `REJECTED`             | Admin or Fraud check declined the payment   | Registration in `REJECTED`                                                                              |
| `CANCELLED`            | User or system cancelled                    | Payer can re-initiate                                                                                   |
| `EXPIRED`              | Order expired                               | Payer can re-initiate                                                                                   |

---

## 3. API Endpoints Contract

Your Part 2 service should expose or plug into the following HTTP endpoints:

### Endpoint A: Create Payment

- **Route:** `POST /api/payments/create`
- **Headers:** `Content-Type: application/json`
- **Request Payload:**

```json
{
  "registrationId": "GAME26-00125",
  "amount": 500,
  "currency": "INR",
  "teamName": "Suspect Crew",
  "customer": {
    "name": "Anish Desai",
    "email": "anish@student.sfit.ac.in",
    "mobile": "9876543210"
  },
  "preferredMethod": "RAZORPAY"
}
```

- **Normalized Response (Gateway Checkout / QR):**

```json
{
  "success": true,
  "paymentId": "PAY_RZP_98234123",
  "status": "PENDING",
  "method": "RAZORPAY",
  "amount": 500,
  "currency": "INR",
  "redirectUrl": "https://api.razorpay.com/v1/checkout/...",
  "qrData": "upi://pay?pa=adg@sbi&pn=ADG&am=500&tr=GAME26-00125",
  "upiUrl": "upi://pay?pa=adg@sbi&pn=ADG&am=500&tr=GAME26-00125"
}
```

- **Normalized Response (Instant Mock or Direct Settlement):**

```json
{
  "success": true,
  "paymentId": "PAY_MOCK_881923",
  "status": "PAID",
  "method": "MOCK",
  "amount": 500,
  "currency": "INR",
  "transactionReference": "MOCK-TXN-881923"
}
```

---

### Endpoint B: Payment Status Query

- **Route:** `GET /api/payments/:registrationId`
- **Response:**

```json
{
  "success": true,
  "payment": {
    "registrationId": "GAME26-00125",
    "paymentId": "PAY_RZP_98234123",
    "amount": 500,
    "currency": "INR",
    "status": "PAID",
    "method": "RAZORPAY",
    "transactionReference": "pay_O9s87d6f5"
  }
}
```

---

### Endpoint C: Manual UPI UTR Submission

- **Route:** `POST /api/payments/:registrationId/manual-upi`
- **Request Payload:**

```json
{
  "transactionReference": "426189012345",
  "evidenceUrl": "https://res.cloudinary.com/.../receipt.png",
  "evidencePublicId": "uploads/receipt_123"
}
```

- **Normalized Response:**

```json
{
  "success": true,
  "status": "PENDING_VERIFICATION",
  "message": "Payment evidence received. Registration is queued for admin verification."
}
```

---

### Endpoint D: Webhook Callback from Gateway

- **Route:** `POST /api/payments/webhook`
- **Headers:** `X-Razorpay-Signature` (or provider equivalent)
- **Behavior:**
  When gateway sends `payment.captured`:
  1. Validate signature using your webhook secret.
  2. Call `paymentService.handleWebhook({ providerPaymentId, status: 'PAID', transactionReference })`.
  3. The Main App automatically promotes registration to `CONFIRMED`, generates ticket & PDF, and emails the student team leader.

---

## 4. How to Plug In Your Real Provider

In `backend/src/services/payment/`:

1. Inspect `interfaces/PaymentProvider.js`.
2. Implement your concrete class:

   ```javascript
   import PaymentProvider from "../interfaces/PaymentProvider.js";
   import Razorpay from "razorpay";

   export class RazorpayProvider extends PaymentProvider {
     constructor() {
       super("RAZORPAY");
       this.client = new Razorpay({
         key_id: process.env.RAZORPAY_KEY_ID,
         key_secret: process.env.RAZORPAY_KEY_SECRET,
       });
     }

     async createPayment({ registrationId, amount, currency, customer }) {
       const order = await this.client.orders.create({
         amount: amount * 100, // paise
         currency,
         receipt: registrationId,
         notes: { registrationId },
       });

       return {
         success: true,
         paymentId: order.id,
         status: "PENDING",
         method: "RAZORPAY",
         amount,
         currency,
         redirectUrl: null,
       };
     }

     async verifyWebhook(rawBody, signature) {
       // Validate Razorpay HMAC signature
     }
   }
   ```

3. In `backend/src/services/payment/PaymentService.js`, set:
   ```javascript
   const activeProvider =
     process.env.MOCK_PAYMENT === "true"
       ? new MockPaymentProvider()
       : new RazorpayProvider();
   ```

---

## 5. Testing With Mock Provider (Out of the Box)

During development, `MOCK_PAYMENT=true` in `.env`.

- You can register a team, go to the payment screen, click **"Simulate Instant Success (Mock)"** or **"Submit UTR for Verification"**, and test the complete end-to-end flow without real money.
- The Admin portal includes a dedicated **Payment Verification** queue where admins can review submitted UTRs and screenshots, and either click **"Verify"** (which moves status to `PAID` + generates tickets) or **"Reject"**.

Good luck! If you have questions regarding the schema, refer to `shared/payment-contract/`.
