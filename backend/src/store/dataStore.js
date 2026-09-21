/**
 * @file dataStore.js
 * @description Centralized in-memory fallback & operational state manager
 * 
 * Provides instantaneous, zero-config local persistence for Part 1 testing,
 * seed data bootstrapping, and atomic ID generation (e.g. GAME26-00101).
 */

import { PaymentStatus, RegistrationStatus } from '../../../shared/payment-contract/payment-status.js';
import { hashPassword } from '../utils/password.js';
import { EVENT_CONFIG } from '../../../shared/eventConfig.js';

class DataStore {
  constructor() {
    this.games = [];
    this.students = [];
    this.teams = [];
    this.teamMembers = [];
    this.registrations = [];
    this.payments = [];
    this.documents = [];
    this.tickets = [];
    this.invoices = [];
    this.admins = [];
    this.auditLogs = [];
    this.registrationCounter = 100;

    this.initDefaultData();

    // The demo registrations hardcode GAME26-00101/00102 without advancing the counter,
    // so without this the first two real teams are handed IDs that already exist and
    // every lookup resolves to the demo record instead of theirs.
    this.syncRegistrationCounter();
  }

  initDefaultData() {
    // 1. Initial Game
    this.games.push({
      _id: 'game_deception_2026',
      name: EVENT_CONFIG.name,
      slug: EVENT_CONFIG.slug,
      status: EVENT_CONFIG.status,
      eventDate: EVENT_CONFIG.startDate,
      endDate: EVENT_CONFIG.endDate,
      venue: EVENT_CONFIG.venue,
      teamConfig: EVENT_CONFIG.teamConfig,
      participantConfig: EVENT_CONFIG.participantConfig,
      registrationConfig: EVENT_CONFIG.registrationConfig,
      createdAt: new Date()
    });

    // 2. Default Admin (admin@adg.org / Deception@2026)
    this.admins.push({
      _id: 'admin_root',
      username: 'adg_admin',
      email: 'admin@adg.org',
      // Hashed at boot from ADMIN_PASSWORD. Never stored in plaintext.
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD || 'Deception@2026'),
      role: 'SUPER_ADMIN',
      name: 'ADG Lead Organizer',
      createdAt: new Date()
    });

    // 3. Demo registrations. These are illustrative only and pollute the dashboard,
    //    the Excel exports and the revenue total, so they are opt-in.
    if (process.env.SEED_DEMO_DATA !== 'true') {
      return;
    }


    const sampleRegId = 'GAME26-00101';
    const sampleTeamId = 'team_sample_alpha';

    const sampleStudents = [
      {
        _id: 'stu_1',
        fullName: 'Aarav Mehta',
        studentId: 'SFIT2024-041',
        email: 'aarav.m@student.sfit.ac.in',
        mobile: '9820123456',
        gender: 'Male',
        branch: 'CMPN',
        year: 'TE',
        collegeType: 'SFIT',
        isSfit: true,
        college: 'SFIT',
        participantType: 'LEADER',
        idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 3600000 * 24)
      },
      {
        _id: 'stu_2',
        fullName: 'Rhea Sharma',
        studentId: 'SFIT2024-042',
        email: 'rhea.s@student.sfit.ac.in',
        mobile: '9820123457',
        gender: 'Female',
        branch: 'INFT',
        year: 'TE',
        collegeType: 'SFIT',
        isSfit: true,
        college: 'SFIT',
        participantType: 'MEMBER',
        idCardUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 3600000 * 24)
      },
      {
        _id: 'stu_3',
        fullName: 'Kabir Verma',
        studentId: 'SFIT2024-043',
        email: 'kabir.v@student.sfit.ac.in',
        mobile: '9820123458',
        gender: 'Male',
        branch: 'EXTC',
        year: 'SE',
        collegeType: 'SFIT',
        isSfit: true,
        college: 'SFIT',
        participantType: 'MEMBER',
        idCardUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 3600000 * 24)
      },
      {
        _id: 'stu_4',
        fullName: 'Ananya Iyer',
        studentId: 'SFIT2024-044',
        email: 'ananya.i@student.sfit.ac.in',
        mobile: '9820123459',
        gender: 'Female',
        branch: 'CMPN',
        year: 'SE',
        collegeType: 'SFIT',
        isSfit: true,
        college: 'SFIT',
        participantType: 'MEMBER',
        idCardUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 3600000 * 24)
      },
      {
        _id: 'stu_5',
        fullName: 'Siddharth Nair',
        studentId: 'SFIT2024-045',
        email: 'siddharth.n@student.sfit.ac.in',
        mobile: '9820123460',
        gender: 'Male',
        branch: 'AIDS',
        year: 'FE',
        collegeType: 'SFIT',
        isSfit: true,
        college: 'SFIT',
        participantType: 'MEMBER',
        idCardUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 3600000 * 24)
      }
    ];

    // Seed Non-SFIT squad members
    const nonSfitStudents = [
      {
        _id: 'stu_6',
        fullName: 'Rohan Joshi',
        studentId: 'DJS2024-881',
        email: 'rohan.joshi@djsanghvi.edu.in',
        mobile: '9819988771',
        gender: 'Male',
        branch: 'CMPN',
        year: 'TE',
        collegeType: 'NON_SFIT',
        isSfit: false,
        college: 'D.J. Sanghvi College of Engineering',
        participantType: 'LEADER',
        idCardUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 3600000 * 12)
      },
      {
        _id: 'stu_7',
        fullName: 'Priya Kulkarni',
        studentId: 'DJS2024-882',
        email: 'priya.k@gmail.com',
        mobile: '9819988772',
        gender: 'Female',
        branch: 'INFT',
        year: 'TE',
        collegeType: 'NON_SFIT',
        isSfit: false,
        college: 'D.J. Sanghvi College of Engineering',
        participantType: 'MEMBER',
        idCardUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 3600000 * 12)
      },
      {
        _id: 'stu_8',
        fullName: 'Aditi Patil',
        studentId: 'TCET2024-301',
        email: 'aditi.patil@thakureducation.org',
        mobile: '9819988773',
        gender: 'Female',
        branch: 'AIML',
        year: 'SE',
        collegeType: 'NON_SFIT',
        isSfit: false,
        college: 'Thakur College of Engineering',
        participantType: 'MEMBER',
        idCardUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 3600000 * 12)
      },
      {
        _id: 'stu_9',
        fullName: 'Sahil Gupta',
        studentId: 'TCET2024-302',
        email: 'sahil.gupta@gmail.com',
        mobile: '9819988774',
        gender: 'Male',
        branch: 'CMPN',
        year: 'SE',
        collegeType: 'NON_SFIT',
        isSfit: false,
        college: 'Thakur College of Engineering',
        participantType: 'MEMBER',
        idCardUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 3600000 * 12)
      },
      {
        _id: 'stu_10',
        fullName: 'Varun Deshmukh',
        studentId: 'VJTI2024-512',
        email: 'varun.deshmukh@vjti.ac.in',
        mobile: '9819988775',
        gender: 'Male',
        branch: 'EXTC',
        year: 'TE',
        collegeType: 'NON_SFIT',
        isSfit: false,
        college: 'VJTI Mumbai',
        participantType: 'MEMBER',
        idCardUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 3600000 * 12)
      }
    ];

    this.students.push(...sampleStudents, ...nonSfitStudents);

    this.teams.push({
      _id: sampleTeamId,
      teamId: 'TEAM-00101',
      name: 'Cyber Imposters',
      gameId: 'game_deception_2026',
      registrationId: sampleRegId,
      teamSize: 5,
      memberIds: sampleStudents.map(s => s._id),
      leaderId: sampleStudents[0]._id,
      createdAt: new Date(Date.now() - 3600000 * 24)
    });

    const sampleTeamId2 = 'team_sample_00102';
    const sampleRegId2 = 'GAME26-00102';

    this.teams.push({
      _id: sampleTeamId2,
      teamId: 'TEAM-00102',
      name: 'Phantom Protocols',
      gameId: 'game_deception_2026',
      registrationId: sampleRegId2,
      teamSize: 5,
      memberIds: nonSfitStudents.map(s => s._id),
      leaderId: nonSfitStudents[0]._id,
      createdAt: new Date(Date.now() - 3600000 * 12)
    });

    sampleStudents.forEach((stu, idx) => {
      this.teamMembers.push({
        _id: `tm_${idx + 1}`,
        teamId: sampleTeamId,
        studentId: stu._id,
        role: idx === 0 ? 'LEADER' : 'MEMBER'
      });
    });

    nonSfitStudents.forEach((stu, idx) => {
      this.teamMembers.push({
        _id: `tm_non_${idx + 1}`,
        teamId: sampleTeamId2,
        studentId: stu._id,
        role: idx === 0 ? 'LEADER' : 'MEMBER'
      });
    });

    this.payments.push({
      _id: 'pay_00101',
      paymentId: 'PAY-MOCK-77182',
      registrationId: sampleRegId,
      amount: 500,
      currency: 'INR',
      method: 'UPI',
      provider: 'MOCK',
      transactionReference: 'UPI-REF-99283144',
      status: PaymentStatus.PAID,
      verifiedAt: new Date(Date.now() - 3600000 * 20),
      verifiedBy: 'adg_admin',
      createdAt: new Date(Date.now() - 3600000 * 24),
      updatedAt: new Date(Date.now() - 3600000 * 20)
    });

    this.payments.push({
      _id: 'pay_00102',
      paymentId: 'PAY-UPI-88273',
      registrationId: sampleRegId2,
      amount: 500,
      currency: 'INR',
      method: 'MANUAL_UPI',
      provider: 'UPI_QR',
      transactionReference: 'UPI-UTR-882736199201',
      evidence: {
        url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        fileName: 'utr_receipt_882736.png'
      },
      status: PaymentStatus.PENDING_VERIFICATION,
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date(Date.now() - 3600000 * 12)
    });

    this.registrations.push({
      _id: 'reg_00101',
      registrationId: sampleRegId,
      gameId: 'game_deception_2026',
      teamId: sampleTeamId,
      teamName: 'Cyber Imposters',
      teamSize: 5,
      contactEmail: 'aarav.m@student.sfit.ac.in',
      contactMobile: '9820123456',
      leaderName: 'Aarav Mehta',
      status: RegistrationStatus.CONFIRMED,
      paymentId: 'PAY-MOCK-77182',
      ticketIssued: true,
      ticketNumber: 'TCK-26-00101',
      createdAt: new Date(Date.now() - 3600000 * 24),
      updatedAt: new Date(Date.now() - 3600000 * 20)
    });

    this.registrations.push({
      _id: 'reg_00102',
      registrationId: sampleRegId2,
      gameId: 'game_deception_2026',
      teamId: sampleTeamId2,
      teamName: 'Phantom Protocols',
      teamSize: 5,
      contactEmail: 'rohan.joshi@djsanghvi.edu.in',
      contactMobile: '9819988771',
      leaderName: 'Rohan Joshi',
      status: RegistrationStatus.PENDING_VERIFICATION,
      paymentId: 'PAY-UPI-88273',
      ticketIssued: false,
      ticketNumber: null,
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date(Date.now() - 3600000 * 12)
    });

    this.tickets.push({
      _id: 'tck_00101',
      ticketNumber: 'TCK-26-00101',
      registrationId: sampleRegId,
      teamName: 'Cyber Imposters',
      qrData: `DECEPTION:REG:${sampleRegId}:TCK-26-00101`,
      generatedAt: new Date(Date.now() - 3600000 * 20)
    });

    this.invoices.push({
      _id: 'inv_00101',
      invoiceNumber: 'INV-26-00101',
      registrationId: sampleRegId,
      paymentId: 'PAY-MOCK-77182',
      amount: 500,
      currency: 'INR',
      paymentMethod: 'UPI',
      transactionReference: 'UPI-REF-99283144',
      generatedAt: new Date(Date.now() - 3600000 * 20)
    });

    this.auditLogs.push({
      _id: 'log_001',
      actor: 'SYSTEM',
      action: 'SAMPLE_REGISTRATION_SEEDED',
      entity: 'Registration',
      entityId: sampleRegId,
      metadata: { teamName: 'Cyber Imposters', size: 5 },
      timestamp: new Date()
    });
  }

  /**
   * Advance the counter past the highest ID already present, whatever its origin
   * (demo seed, or records restored from the database).
   */
  syncRegistrationCounter() {
    const highest = this.registrations.reduce((max, r) => {
      const n = parseInt(String(r.registrationId || '').replace('GAME26-', ''), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, this.registrationCounter);
    this.registrationCounter = highest;
  }

  generateRegistrationId() {
    this.registrationCounter += 1;
    let candidate = `GAME26-${String(this.registrationCounter).padStart(5, '0')}`;
    // Defensive: never hand out an ID that is already taken.
    while (this.registrations.some(r => r.registrationId === candidate)) {
      this.registrationCounter += 1;
      candidate = `GAME26-${String(this.registrationCounter).padStart(5, '0')}`;
    }
    return candidate;
  }

  logAudit({ actor = 'SYSTEM', action, entity, entityId, metadata = {} }) {
    const log = {
      _id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actor,
      action,
      entity,
      entityId,
      metadata,
      timestamp: new Date()
    };
    this.auditLogs.unshift(log);
    return log;
  }
}

export const store = new DataStore();
export default store;
