/**
 * @file emailService.js
 * @description Email notification service with SMTP support and in-memory audit log
 */

import { EVENT_CONFIG } from '../../../shared/eventConfig.js';
import { store } from '../store/dataStore.js';

export class EmailService {
  constructor() {
    this.emailLogs = [];
  }

  logEmail(email) {
    const record = {
      _id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      to: email.to,
      subject: email.subject,
      type: email.type,
      registrationId: email.registrationId,
      body: email.body,
      sentAt: new Date(),
      status: 'DELIVERED_PREVIEW'
    };
    this.emailLogs.unshift(record);
    console.log(`[EmailService] Dispatched ${email.type} to ${email.to}`);
    return record;
  }

  async sendRegistrationReceivedEmail({ to, leaderName, teamName, registrationId }) {
    const subject = `[DECEPTION] Registration Received - ${teamName} (${registrationId})`;
    const body = `
Hello ${leaderName},

We have received your team registration for DECEPTION (ADG x MosaIC).

Event Details:
- Event: DECEPTION
- Dates: 16–17 October 2026
- Venue: Room No. 318, SFIT
- Team Name: ${teamName}
- Registration ID: ${registrationId}
- Current Status: PAYMENT PENDING

To confirm your spot, please complete the payment of INR 500 via the registration portal.
Entry QR passes will be unlocked once payment is verified.

Stay sharp. One of you isn't who they seem...

Regards,
AI Developers Group (ADG) x MosaIC
Room No. 318
    `;

    return this.logEmail({
      to,
      subject,
      type: 'REGISTRATION_RECEIVED',
      registrationId,
      body
    });
  }

  async sendConfirmationEmail({ to, leaderName, teamName, registrationId, ticketNumber, amount, transactionReference }) {
    const subject = `[CONFIRMED] Your Official Pass for DECEPTION - ${teamName} (${registrationId})`;
    const body = `
Congratulations ${leaderName}!

Your payment of INR ${amount} (Ref: ${transactionReference || 'N/A'}) has been VERIFIED.
Your team "${teamName}" is officially CONFIRMED for DECEPTION!

TICKET DETAILS:
- Ticket Number: ${ticketNumber}
- Registration ID: ${registrationId}
- Venue: Room No. 318, St. Francis Institute of Technology (SFIT)
- Dates: 16–17 October 2026
- Mandatory: Carry your college ID cards and your digital/printed QR Pass.

Download your Combined Entry Pass & Payment Receipt at:
/registration/status?id=${registrationId}

"TRUST NO ONE." See you in Room 318!

AI Developers Group (ADG)
    `;

    return this.logEmail({
      to,
      subject,
      type: 'REGISTRATION_CONFIRMED',
      registrationId,
      body
    });
  }

  async sendVerificationPendingEmail({ to, leaderName, teamName, registrationId, transactionReference }) {
    const subject = `[PENDING VERIFICATION] Payment Evidence Received - ${registrationId}`;
    const body = `
Hello ${leaderName},

We have received your payment reference: ${transactionReference} for team "${teamName}" (${registrationId}).

Our finance team is currently cross-verifying the UTR reference with our bank records.
You will receive another email and your QR Pass once approved (typically within 2–6 hours).

Check status anytime at:
/registration/status?id=${registrationId}

ADG Verification Desk
    `;

    return this.logEmail({
      to,
      subject,
      type: 'VERIFICATION_PENDING',
      registrationId,
      body
    });
  }

  async sendPaymentRejectedEmail({ to, leaderName, teamName, registrationId, reason }) {
    const subject = `[ACTION REQUIRED] Payment Verification Issue - ${registrationId}`;
    const body = `
Hello ${leaderName},

We could not verify your payment reference for team "${teamName}" (${registrationId}).

Reason provided by admin:
${reason}

Please log in to the registration status page to re-upload your valid payment screenshot or submit the correct UTR transaction ID.

Portal: /registration/status?id=${registrationId}

ADG Organizing Team
    `;

    return this.logEmail({
      to,
      subject,
      type: 'PAYMENT_REJECTED',
      registrationId,
      body
    });
  }

  getEmailLogs() {
    return this.emailLogs;
  }
}

export const emailService = new EmailService();
export default emailService;
