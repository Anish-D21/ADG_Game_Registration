/**
 * @file registrationService.js
 * @description Orchestrates the full multi-step event registration flow
 */

import { studentService } from './studentService.js';
import { teamService } from './teamService.js';
import { paymentService } from './payment/PaymentService.js';
import { emailService } from './emailService.js';
import { store } from '../store/dataStore.js';
import { RegistrationStatus } from '../../../shared/payment-contract/payment-status.js';
import { EVENT_CONFIG } from '../../../shared/eventConfig.js';

export class RegistrationService {
  async registerTeam(data) {
    const { teamName, players, preferredMethod = 'MOCK' } = data;

    if (!teamName || teamName.trim().length < 2) {
      throw new Error('Team name is required and must be at least 2 characters long.');
    }

    if (!Array.isArray(players)) {
      throw new Error('Players array is required.');
    }

    // 1. Strict Team Size Validation
    teamService.validateTeamSize(players.length);

    // 2. Validate & Upsert All Students
    const studentRecords = [];
    const seenEmails = new Set();
    const seenStudentIds = new Set();

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const playerNum = i + 1;

      if (!p.fullName || !p.fullName.trim()) {
        throw new Error(`Player ${playerNum}: Full name is required.`);
      }
      if (!p.studentId || !p.studentId.trim()) {
        throw new Error(`Player ${playerNum}: Student ID / Roll number is required.`);
      }
      if (!p.email || !p.email.trim()) {
        throw new Error(`Player ${playerNum}: College email is required.`);
      }
      if (!p.mobile || !p.mobile.trim()) {
        throw new Error(`Player ${playerNum}: Mobile number is required.`);
      }

      const normEmail = p.email.trim().toLowerCase();
      const normStudentId = p.studentId.trim().toUpperCase();

      if (seenEmails.has(normEmail)) {
        throw new Error(`Duplicate email within team: "${normEmail}" was provided for multiple players.`);
      }
      if (seenStudentIds.has(normStudentId)) {
        throw new Error(`Duplicate Student ID within team: "${normStudentId}" was provided for multiple players.`);
      }

      seenEmails.add(normEmail);
      seenStudentIds.add(normStudentId);

      const stu = await studentService.upsertStudent({
        ...p,
        participantType: i === 0 ? 'LEADER' : 'MEMBER'
      });
      studentRecords.push(stu);
    }

    // 3. Generate Atomic Human-Readable Registration ID
    const registrationId = store.generateRegistrationId();

    // 4. Create Team record
    const team = await teamService.createTeam({
      teamName,
      players: studentRecords,
      registrationId
    });

    const leader = studentRecords[0];

    // 5. Create Registration record
    const registration = {
      _id: `reg_${Date.now()}`,
      registrationId,
      gameId: 'game_deception_2026',
      teamId: team._id,
      teamName: team.name,
      teamSize: studentRecords.length,
      leaderName: leader.fullName,
      contactEmail: leader.email,
      contactMobile: leader.mobile,
      status: RegistrationStatus.PAYMENT_PENDING,
      paymentId: '',
      ticketIssued: false,
      ticketNumber: '',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.registrations.push(registration);

    // 6. Initialize Payment Order
    const paymentOrder = await paymentService.createPayment({
      registrationId,
      amount: EVENT_CONFIG.registrationConfig.amount,
      currency: EVENT_CONFIG.registrationConfig.currency,
      teamName: team.name,
      customer: {
        name: leader.fullName,
        email: leader.email,
        mobile: leader.mobile
      },
      preferredMethod
    });

    registration.paymentId = paymentOrder.paymentId;

    // 7. Send "Registration Received" Email
    await emailService.sendRegistrationReceivedEmail({
      to: leader.email,
      leaderName: leader.fullName,
      teamName: team.name,
      registrationId
    });

    // 8. Audit Log
    store.logAudit({
      actor: leader.email,
      action: 'TEAM_REGISTRATION_CREATED',
      entity: 'Registration',
      entityId: registrationId,
      metadata: { teamName: team.name, size: studentRecords.length, paymentId: paymentOrder.paymentId }
    });

    return {
      success: true,
      registration,
      team,
      players: studentRecords,
      paymentOrder
    };
  }

  async getRegistrationDetails(registrationId) {
    const reg = store.registrations.find(r => r.registrationId === registrationId);
    if (!reg) return null;

    const team = store.teams.find(t => t.registrationId === registrationId || t._id === reg.teamId);
    const payment = store.payments.find(p => p.registrationId === registrationId);
    const ticket = store.tickets.find(t => t.registrationId === registrationId);
    const invoice = store.invoices.find(i => i.registrationId === registrationId);

    const studentIds = team ? team.memberIds : [];
    const members = store.students.filter(s => studentIds.includes(s._id) || studentIds.includes(String(s._id)));

    return {
      registration: reg,
      team,
      members,
      payment,
      ticket,
      invoice
    };
  }

  async getAllRegistrations(filters = {}) {
    let list = [...store.registrations];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(r => 
        r.registrationId.toLowerCase().includes(q) ||
        r.teamName.toLowerCase().includes(q) ||
        r.leaderName.toLowerCase().includes(q) ||
        r.contactEmail.toLowerCase().includes(q)
      );
    }

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(r => r.status === filters.status);
    }

    if (filters.teamSize) {
      list = list.filter(r => r.teamSize === Number(filters.teamSize));
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

export const registrationService = new RegistrationService();
export default registrationService;
