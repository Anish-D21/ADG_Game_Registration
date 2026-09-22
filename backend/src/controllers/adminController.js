/**
 * @file adminController.js
 * @description Controllers for Admin Portal statistics, verifications & entity views
 */

import { store } from '../store/dataStore.js';
import { verifyPassword } from '../utils/password.js';
import { expectedAmountForTeamSize, totalSubmitted } from '../utils/fees.js';
import { generateAdminToken } from '../middleware/authMiddleware.js';
import { paymentService } from '../services/payment/PaymentService.js';
import { excelService } from '../services/excelService.js';
import { emailService } from '../services/emailService.js';

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = store.admins.find(
      a => a.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      store.logAudit({
        actor: email,
        action: 'ADMIN_LOGIN_FAILED',
        entity: 'Admin',
        entityId: email,
        metadata: { reason: 'Bad credentials' }
      });
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = generateAdminToken(admin);

    store.logAudit({
      actor: admin.username,
      action: 'ADMIN_LOGIN_SUCCESS',
      entity: 'Admin',
      entityId: admin._id,
      metadata: { role: admin.role }
    });

    return res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const totalRegistrations = store.registrations.length;
    const confirmedRegistrations = store.registrations.filter(r => r.status === 'CONFIRMED').length;
    const pendingPayments = store.registrations.filter(r => r.status === 'PAYMENT_PENDING').length;
    const pendingVerification = store.registrations.filter(r => r.status === 'PAYMENT_VERIFICATION').length;
    const rejectedRegistrations = store.registrations.filter(r => r.status === 'REJECTED').length;
    const totalTeams = store.teams.length;
    const totalParticipants = store.students.length;
    const totalRevenue = store.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return res.json({
      success: true,
      stats: {
        totalRegistrations,
        confirmedRegistrations,
        pendingPayments,
        pendingVerification,
        rejectedRegistrations,
        totalTeams,
        totalParticipants,
        totalRevenue
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAdminRegistrations(req, res) {
  try {
    const { search, status, teamSize } = req.query;
    let list = [...store.registrations];

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(r => 
        r.registrationId.toLowerCase().includes(q) ||
        r.teamName.toLowerCase().includes(q) ||
        r.leaderName.toLowerCase().includes(q) ||
        r.contactEmail.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'ALL') {
      list = list.filter(r => r.status === status);
    }

    if (teamSize && teamSize !== 'ALL') {
      list = list.filter(r => r.teamSize === Number(teamSize));
    }

    // Enrich with payment info
    const enriched = list.map(r => {
      const p = store.payments.find(pay => pay.registrationId === r.registrationId);
      const team = store.teams.find(t => t.registrationId === r.registrationId || t._id === r.teamId);
      return {
        ...r,
        paymentStatus: p ? p.status : 'NOT_STARTED',
        paymentMethod: p ? p.method : 'N/A',
        paymentEvidence: p?.evidence?.url || null,
        transactionReference: p?.transactionReference || null,
        teamId: team?.teamId || 'N/A'
      };
    });

    return res.json({
      success: true,
      count: enriched.length,
      registrations: enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAdminStudents(req, res) {
  try {
    const { search, branch, year } = req.query;
    let list = [...store.students];

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q)
      );
    }

    if (branch && branch !== 'ALL') {
      list = list.filter(s => s.branch === branch);
    }

    if (year && year !== 'ALL') {
      list = list.filter(s => s.year === year);
    }

    return res.json({
      success: true,
      count: list.length,
      students: list
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAdminTeams(req, res) {
  try {
    const enrichedTeams = store.teams.map(t => {
      const reg = store.registrations.find(r => r.registrationId === t.registrationId);
      const pay = store.payments.find(p => p.registrationId === t.registrationId);
      const members = store.students.filter(s => t.memberIds.includes(s._id) || t.memberIds.includes(String(s._id)));
      return {
        ...t,
        registrationStatus: reg?.status || 'UNKNOWN',
        paymentStatus: pay?.status || 'NOT_STARTED',
        members
      };
    });

    return res.json({
      success: true,
      count: enrichedTeams.length,
      teams: enrichedTeams
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAdminPayments(req, res) {
  try {
    const enriched = store.payments.map(p => {
      const reg = store.registrations.find(r => r.registrationId === p.registrationId);
      const expected = p.amountExpected || expectedAmountForTeamSize(reg?.teamSize);
      const paid = totalSubmitted(p);
      return {
        ...p,
        entries: Array.isArray(p.entries) ? p.entries : [],
        amountExpected: expected,
        amountPaid: paid,
        amountRemaining: Math.max(0, expected - paid),
        fullyPaid: paid >= expected,
        teamSize: reg?.teamSize || 0,
        teamName: reg?.teamName || p.metadata?.teamName || 'Unknown Team',
        leaderName: reg?.leaderName || p.metadata?.customer?.name || 'Unknown',
        contactEmail: reg?.contactEmail || p.metadata?.customer?.email || 'N/A'
      };
    });

    return res.json({
      success: true,
      count: enriched.length,
      payments: enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { paymentId } = req.params;
    const adminUser = req.admin?.username || 'ADG_ADMIN';

    const result = await paymentService.verifyAdminPayment({ paymentId, adminUser });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function rejectPayment(req, res) {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const adminUser = req.admin?.username || 'ADG_ADMIN';

    const result = await paymentService.rejectAdminPayment({ paymentId, reason, adminUser });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function exportAllExcel(req, res) {
  try {
    const workbook = await excelService.generateMasterWorkbook();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="DECEPTION_2026_MASTER_REGISTRATIONS.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

    store.logAudit({
      actor: req.admin?.username || 'ADMIN',
      action: 'EXCEL_EXPORT_MASTER',
      entity: 'Report',
      entityId: 'DECEPTION_2026_MASTER_REGISTRATIONS.xlsx',
      metadata: { registrationsCount: store.registrations.length }
    });
  } catch (err) {
    console.error('Master Excel Export error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function exportTeamsExcel(req, res) {
  try {
    const workbook = await excelService.generateTeamsWorkbook();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="DECEPTION_2026_TEAMS_LIST.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

    store.logAudit({
      actor: req.admin?.username || 'ADMIN',
      action: 'EXCEL_EXPORT_TEAMS',
      entity: 'Report',
      entityId: 'DECEPTION_2026_TEAMS_LIST.xlsx',
      metadata: { teamsCount: store.teams.length }
    });
  } catch (err) {
    console.error('Teams Excel Export error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function exportStudentsExcel(req, res) {
  try {
    const workbook = await excelService.generateStudentsWorkbook();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="DECEPTION_2026_STUDENTS_LIST.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

    store.logAudit({
      actor: req.admin?.username || 'ADMIN',
      action: 'EXCEL_EXPORT_STUDENTS',
      entity: 'Report',
      entityId: 'DECEPTION_2026_STUDENTS_LIST.xlsx',
      metadata: { studentsCount: store.students.length }
    });
  } catch (err) {
    console.error('Students Excel Export error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function exportPaymentsExcel(req, res) {
  try {
    const workbook = await excelService.generatePaymentsWorkbook();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="DECEPTION_2026_PAYMENTS_LIST.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

    store.logAudit({
      actor: req.admin?.username || 'ADMIN',
      action: 'EXCEL_EXPORT_PAYMENTS',
      entity: 'Report',
      entityId: 'DECEPTION_2026_PAYMENTS_LIST.xlsx',
      metadata: { paymentsCount: store.payments.length }
    });
  } catch (err) {
    console.error('Payments Excel Export error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAuditLogs(req, res) {
  try {
    return res.json({
      success: true,
      count: store.auditLogs.length,
      logs: store.auditLogs
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getEmailLogs(req, res) {
  try {
    return res.json({
      success: true,
      emails: emailService.getEmailLogs()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
