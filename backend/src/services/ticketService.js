/**
 * @file ticketService.js
 * @description Generates secure QR codes, passes, and ticket metadata
 */

import QRCode from 'qrcode';
import { store } from '../store/dataStore.js';
import { EVENT_CONFIG } from '../../../shared/eventConfig.js';

export class TicketService {
  async generateTicket(registration) {
    const existing = store.tickets.find(t => t.registrationId === registration.registrationId);
    if (existing) {
      return existing;
    }

    const ticketNumber = `TCK-26-${registration.registrationId.replace('GAME26-', '')}`;
    const verificationPayload = JSON.stringify({
      event: EVENT_CONFIG.name,
      regId: registration.registrationId,
      team: registration.teamName,
      tck: ticketNumber,
      venue: EVENT_CONFIG.venue,
      date: EVENT_CONFIG.eventDateDisplay
    });

    let qrCodeUrl = '';
    try {
      qrCodeUrl = await QRCode.toDataURL(verificationPayload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        color: {
          dark: '#111827',
          light: '#FFFDF0'
        },
        width: 280
      });
    } catch (e) {
      console.warn('QR Code generation fallback:', e);
    }

    const ticket = {
      _id: `tck_${Date.now()}`,
      ticketNumber,
      registrationId: registration.registrationId,
      teamName: registration.teamName,
      qrData: verificationPayload,
      qrCodeUrl,
      documentUrl: `/api/tickets/${registration.registrationId}/pdf`,
      generatedAt: new Date()
    };

    store.tickets.push(ticket);
    return ticket;
  }

  async getTicket(registrationId) {
    let ticket = store.tickets.find(t => t.registrationId === registrationId);
    if (!ticket) {
      const reg = store.registrations.find(r => r.registrationId === registrationId);
      if (reg && reg.status === 'CONFIRMED') {
        ticket = await this.generateTicket(reg);
      }
    }
    return ticket || null;
  }
}

export const ticketService = new TicketService();
export default ticketService;
