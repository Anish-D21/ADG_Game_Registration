/**
 * @file excelService.js
 * @description Generates formatted Excel (.xlsx) workbooks using ExcelJS
 * Supports individual exports: Teams, Students, Payments, and Master Workbook.
 * Includes College ID Card links, Entry Ticket codes & links, and Invoice/Receipt info.
 */

import ExcelJS from 'exceljs';
import { store } from '../store/dataStore.js';
import { EVENT_CONFIG } from '../../../shared/eventConfig.js';

export class ExcelService {
  /**
   * Helper to format cell styles for headers
   */
  getHeaderStyle(bgColorArgb = 'FF111827') {
    return {
      font: { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColorArgb } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'thin', color: { argb: 'FF333333' } },
        left: { style: 'thin', color: { argb: 'FF333333' } },
        bottom: { style: 'medium', color: { argb: 'FF111827' } },
        right: { style: 'thin', color: { argb: 'FF333333' } }
      }
    };
  }

  applyDataCellStyles(row, isEven = false) {
    const bgArgb = isEven ? 'FFF9FAFB' : 'FFFFFFFF';
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = cell.font || { name: 'Arial', size: 10 };
      if (!cell.fill || cell.fill.type !== 'pattern') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
      cell.alignment = cell.alignment || { vertical: 'middle' };
    });
  }

  /**
   * Builds the Teams Worksheet on any workbook
   */
  populateTeamsSheet(worksheet) {
    worksheet.columns = [
      { header: 'Registration ID', key: 'registrationId', width: 18 },
      { header: 'Team ID', key: 'teamId', width: 16 },
      { header: 'Team Name', key: 'teamName', width: 24 },
      { header: 'Squad Size', key: 'teamSize', width: 12 },
      { header: 'Leader Name', key: 'leaderName', width: 22 },
      { header: 'Leader Institute', key: 'leaderInstitute', width: 18 },
      { header: 'Leader College', key: 'leaderCollege', width: 26 },
      { header: 'Leader Email', key: 'leaderEmail', width: 30 },
      { header: 'Leader Mobile', key: 'leaderMobile', width: 16 },
      { header: 'Leader ID Card', key: 'leaderIdCard', width: 22 },
      { header: 'Registration Status', key: 'regStatus', width: 20 },
      { header: 'Payment Status', key: 'paymentStatus', width: 20 },
      { header: 'Amount (INR)', key: 'amount', width: 15 },
      { header: 'Payment Method', key: 'method', width: 16 },
      { header: 'UTR / Transaction Ref', key: 'utr', width: 26 },
      { header: 'Entry Ticket Number', key: 'ticketNumber', width: 22 },
      { header: 'Entry Ticket Pass', key: 'ticketLink', width: 24 },
      { header: 'Receipt / Invoice Number', key: 'invoiceNumber', width: 24 },
      { header: 'Receipt / Invoice Link', key: 'invoiceLink', width: 24 },
      { header: 'Payment Proof', key: 'evidenceLink', width: 22 },
      { header: 'Registered At', key: 'createdAt', width: 22 }
    ];

    const header = worksheet.getRow(1);
    header.height = 26;
    header.eachCell((cell) => {
      cell.style = this.getHeaderStyle('FF111827'); // Dark Slate Navy
    });

    store.registrations.forEach((reg, idx) => {
      const payment = store.payments.find(p => p.registrationId === reg.registrationId);
      const team = store.teams.find(t => t.registrationId === reg.registrationId || t._id === reg.teamId);
      const ticket = store.tickets.find(t => t.registrationId === reg.registrationId);
      const invoice = store.invoices.find(i => i.registrationId === reg.registrationId);
      
      const memberIds = team?.memberIds || [];
      const leader = store.students.find(s => 
        (s.email?.toLowerCase() === reg.contactEmail?.toLowerCase()) || 
        (memberIds.includes(s._id) && s.participantType === 'LEADER')
      );

      const isLeaderSfit = leader ? (leader.collegeType === 'SFIT' || leader.isSfit !== false) : true;
      const leaderCollege = leader?.college || (isLeaderSfit ? 'SFIT' : 'Non-SFIT College');

      const row = worksheet.addRow({
        registrationId: reg.registrationId,
        teamId: team?.teamId || 'N/A',
        teamName: reg.teamName,
        teamSize: reg.teamSize,
        leaderName: reg.leaderName || leader?.fullName || 'N/A',
        leaderInstitute: isLeaderSfit ? 'SFIT' : 'NON-SFIT',
        leaderCollege: leaderCollege,
        leaderEmail: reg.contactEmail,
        leaderMobile: reg.contactMobile,
        regStatus: reg.status,
        paymentStatus: payment?.status || 'NOT_STARTED',
        amount: payment?.amount || 500,
        method: payment?.method || 'N/A',
        utr: payment?.transactionReference || 'N/A',
        ticketNumber: ticket?.ticketNumber || (reg.ticketIssued ? reg.ticketNumber : 'PENDING'),
        invoiceNumber: invoice?.invoiceNumber || (payment?.status === 'PAID' ? `INV-${reg.registrationId.replace('GAME26-', '')}` : 'PENDING'),
        createdAt: reg.createdAt ? new Date(reg.createdAt).toLocaleString() : new Date().toLocaleString()
      });
      row.height = 22;

      // Clickable Hyperlinks
      if (leader?.idCardUrl) {
        const idCell = row.getCell('leaderIdCard');
        idCell.value = { text: 'View ID Card', hyperlink: leader.idCardUrl };
        idCell.font = { name: 'Arial', size: 10, color: { argb: 'FF0066CC' }, underline: true };
      } else {
        row.getCell('leaderIdCard').value = 'Pending Upload';
      }

      if (ticket?.ticketNumber || reg.ticketIssued) {
        const tCell = row.getCell('ticketLink');
        tCell.value = {
          text: `Download Ticket (${ticket?.ticketNumber || reg.ticketNumber || 'Pass'})`,
          hyperlink: `/registration/status?id=${reg.registrationId}`
        };
        tCell.font = { name: 'Arial', size: 10, color: { argb: 'FF0066CC' }, underline: true };
      } else {
        row.getCell('ticketLink').value = 'Ticket Pending Verification';
      }

      const invCell = row.getCell('invoiceLink');
      invCell.value = {
        text: 'View Receipt Portal',
        hyperlink: `/registration/status?id=${reg.registrationId}`
      };
      invCell.font = { name: 'Arial', size: 10, color: { argb: 'FF0066CC' }, underline: true };

      if (payment?.evidence?.url) {
        const evCell = row.getCell('evidenceLink');
        evCell.value = { text: 'View UTR Screenshot', hyperlink: payment.evidence.url };
        evCell.font = { name: 'Arial', size: 10, color: { argb: 'FF0066CC' }, underline: true };
      } else {
        row.getCell('evidenceLink').value = payment?.method === 'MOCK' ? 'Mock Verified' : 'None';
      }

      this.applyDataCellStyles(row, idx % 2 === 1);
    });
  }

  /**
   * Builds the Students / Participants Worksheet on any workbook
   */
  populateStudentsSheet(worksheet) {
    worksheet.columns = [
      { header: 'Registration ID', key: 'registrationId', width: 18 },
      { header: 'Squad Team Name', key: 'teamName', width: 24 },
      { header: 'Role', key: 'participantType', width: 14 },
      { header: 'Student ID / Roll No', key: 'studentId', width: 20 },
      { header: 'Student Name', key: 'fullName', width: 24 },
      { header: 'Institute Type', key: 'collegeType', width: 18 },
      { header: 'College / Institute Name', key: 'college', width: 28 },
      { header: 'Email Address', key: 'email', width: 30 },
      { header: 'Mobile Number', key: 'mobile', width: 16 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Branch', key: 'branch', width: 14 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'College ID Card', key: 'idCardLink', width: 22 },
      { header: 'College ID Card URL', key: 'idCardUrl', width: 32 },
      { header: 'Entry Ticket Number', key: 'ticketNumber', width: 22 },
      { header: 'Entry Ticket Link', key: 'ticketLink', width: 24 },
      { header: 'Invoice / Receipt No', key: 'invoiceNumber', width: 22 },
      { header: 'Payment Status', key: 'paymentStatus', width: 18 }
    ];

    const header = worksheet.getRow(1);
    header.height = 26;
    header.eachCell((cell) => {
      cell.style = this.getHeaderStyle('FFE5005A'); // Vibrant Crimson / Poster Pink
    });

    let rowIndex = 0;
    store.registrations.forEach((reg) => {
      const team = store.teams.find(t => t.registrationId === reg.registrationId || t._id === reg.teamId);
      const payment = store.payments.find(p => p.registrationId === reg.registrationId);
      const ticket = store.tickets.find(t => t.registrationId === reg.registrationId);
      const invoice = store.invoices.find(i => i.registrationId === reg.registrationId);

      const memberIds = team?.memberIds || [];
      const teamStudents = store.students.filter(s => memberIds.includes(s._id) || memberIds.includes(String(s._id)));

      teamStudents.forEach((stu) => {
        const isSfit = stu.collegeType === 'SFIT' || stu.isSfit !== false || stu.college === 'SFIT';
        const collegeName = stu.college || (isSfit ? 'SFIT' : 'Non-SFIT College');

        const row = worksheet.addRow({
          registrationId: reg.registrationId,
          teamName: reg.teamName,
          participantType: stu.participantType || 'MEMBER',
          studentId: stu.studentId,
          fullName: stu.fullName,
          collegeType: isSfit ? 'SFIT STUDENT' : 'NON-SFIT',
          college: collegeName,
          email: stu.email,
          mobile: stu.mobile,
          gender: stu.gender,
          branch: stu.branch,
          year: stu.year,
          idCardUrl: stu.idCardUrl || 'N/A',
          ticketNumber: ticket?.ticketNumber || (reg.ticketIssued ? reg.ticketNumber : 'PENDING'),
          invoiceNumber: invoice?.invoiceNumber || (payment?.status === 'PAID' ? `INV-${reg.registrationId.replace('GAME26-', '')}` : 'PENDING'),
          paymentStatus: payment?.status || 'NOT_STARTED'
        });
        row.height = 22;

        if (stu.idCardUrl) {
          const idCell = row.getCell('idCardLink');
          idCell.value = { text: 'View College ID Card', hyperlink: stu.idCardUrl };
          idCell.font = { name: 'Arial', size: 10, color: { argb: 'FF0066CC' }, underline: true };
        } else {
          row.getCell('idCardLink').value = 'Pending Upload';
        }

        if (ticket?.ticketNumber || reg.ticketIssued) {
          const tCell = row.getCell('ticketLink');
          tCell.value = {
            text: `View Ticket (${ticket?.ticketNumber || reg.ticketNumber || 'Pass'})`,
            hyperlink: `/registration/status?id=${reg.registrationId}`
          };
          tCell.font = { name: 'Arial', size: 10, color: { argb: 'FF0066CC' }, underline: true };
        } else {
          row.getCell('ticketLink').value = 'Ticket Not Issued';
        }

        this.applyDataCellStyles(row, rowIndex % 2 === 1);
        rowIndex++;
      });
    });
  }

  /**
   * Builds the Payments Worksheet on any workbook
   */
  populatePaymentsSheet(worksheet) {
    worksheet.columns = [
      { header: 'Payment ID', key: 'paymentId', width: 22 },
      { header: 'Registration ID', key: 'registrationId', width: 18 },
      { header: 'Squad Team Name', key: 'teamName', width: 24 },
      { header: 'Leader Name', key: 'leaderName', width: 22 },
      { header: 'Leader Contact', key: 'leaderContact', width: 26 },
      { header: 'Amount (INR)', key: 'amount', width: 15 },
      { header: 'Payment Method', key: 'method', width: 18 },
      { header: 'Payment Status', key: 'status', width: 22 },
      { header: 'UTR / Transaction Ref', key: 'utr', width: 26 },
      { header: 'Invoice / Receipt Number', key: 'invoiceNumber', width: 24 },
      { header: 'Receipt / Invoice Link', key: 'invoiceLink', width: 24 },
      { header: 'UTR Screenshot Proof', key: 'evidenceLink', width: 24 },
      { header: 'Entry Ticket Number', key: 'ticketNumber', width: 22 },
      { header: 'Entry Ticket Link', key: 'ticketLink', width: 24 },
      { header: 'Submitted At', key: 'createdAt', width: 22 },
      { header: 'Verified At', key: 'verifiedAt', width: 22 },
      { header: 'Verified By', key: 'verifiedBy', width: 20 }
    ];

    const header = worksheet.getRow(1);
    header.height = 26;
    header.eachCell((cell) => {
      cell.style = this.getHeaderStyle('FF00AFC6'); // Neon Cyan Header
    });

    store.payments.forEach((pay, idx) => {
      const reg = store.registrations.find(r => r.registrationId === pay.registrationId);
      const ticket = store.tickets.find(t => t.registrationId === pay.registrationId);
      const invoice = store.invoices.find(i => i.registrationId === pay.registrationId);

      const row = worksheet.addRow({
        paymentId: pay.paymentId,
        registrationId: pay.registrationId,
        teamName: reg?.teamName || pay.metadata?.teamName || 'N/A',
        leaderName: reg?.leaderName || 'N/A',
        leaderContact: reg?.contactEmail ? `${reg.contactEmail} / ${reg.contactMobile}` : 'N/A',
        amount: pay.amount,
        method: pay.method,
        status: pay.status,
        utr: pay.transactionReference || 'N/A',
        invoiceNumber: invoice?.invoiceNumber || (pay.status === 'PAID' ? `INV-${pay.registrationId.replace('GAME26-', '')}` : 'PENDING'),
        ticketNumber: ticket?.ticketNumber || (reg?.ticketIssued ? reg.ticketNumber : 'PENDING'),
        createdAt: pay.createdAt ? new Date(pay.createdAt).toLocaleString() : 'N/A',
        verifiedAt: pay.verifiedAt ? new Date(pay.verifiedAt).toLocaleString() : 'Pending',
        verifiedBy: pay.verifiedBy || 'N/A'
      });
      row.height = 22;

      // Clickable Links
      const invCell = row.getCell('invoiceLink');
      invCell.value = {
        text: 'View Official Receipt',
        hyperlink: `/registration/status?id=${pay.registrationId}`
      };
      invCell.font = { name: 'Arial', size: 10, color: { argb: 'FF0066CC' }, underline: true };

      if (pay.evidence?.url) {
        const evCell = row.getCell('evidenceLink');
        evCell.value = { text: 'View Payment Proof', hyperlink: pay.evidence.url };
        evCell.font = { name: 'Arial', size: 10, color: { argb: 'FF0066CC' }, underline: true };
      } else {
        row.getCell('evidenceLink').value = pay.method === 'MOCK' ? 'Simulated Instant Pay' : 'None';
      }

      if (ticket?.ticketNumber || reg?.ticketIssued) {
        const tCell = row.getCell('ticketLink');
        tCell.value = {
          text: `Download Ticket (${ticket?.ticketNumber || reg?.ticketNumber || 'Pass'})`,
          hyperlink: `/registration/status?id=${pay.registrationId}`
        };
        tCell.font = { name: 'Arial', size: 10, color: { argb: 'FF0066CC' }, underline: true };
      } else {
        row.getCell('ticketLink').value = 'Pending Verification';
      }

      this.applyDataCellStyles(row, idx % 2 === 1);
    });
  }

  /**
   * Generates Master Workbook with 4 Sheets: Overview, Teams, Students, Payments
   */
  async generateMasterWorkbook() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DECEPTION Event Registration Portal';
    workbook.created = new Date();

    // Sheet 1: Overview Summary
    const overviewSheet = workbook.addWorksheet('Overview Summary', { views: [{ showGridLines: true }] });
    overviewSheet.columns = [
      { header: 'Event Parameter', key: 'param', width: 30 },
      { header: 'Details / Metrics', key: 'value', width: 45 }
    ];

    const h = overviewSheet.getRow(1);
    h.height = 26;
    h.eachCell(c => { c.style = this.getHeaderStyle('FF111827'); });

    const totalRegs = store.registrations.length;
    const confirmedRegs = store.registrations.filter(r => r.status === 'CONFIRMED').length;
    const totalStudents = store.students.length;
    const sfitStudents = store.students.filter(s => s.collegeType === 'SFIT' || s.isSfit !== false || s.college === 'SFIT').length;
    const nonSfitStudents = totalStudents - sfitStudents;
    const totalRev = store.payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.amount || 0), 0);

    const metrics = [
      { param: 'Event Title', value: EVENT_CONFIG.name },
      { param: 'Organizers', value: `${EVENT_CONFIG.organizer} x ${EVENT_CONFIG.collaboration}` },
      { param: 'Event Dates', value: EVENT_CONFIG.eventDateDisplay },
      { param: 'Venue', value: `${EVENT_CONFIG.venue} (${EVENT_CONFIG.college})` },
      { param: 'Total Registered Squads', value: String(totalRegs) },
      { param: 'Confirmed Squads (Ticket Issued)', value: String(confirmedRegs) },
      { param: 'Total Participants Registered', value: String(totalStudents) },
      { param: 'SFIT Students Count', value: `${sfitStudents} (${Math.round((sfitStudents / (totalStudents || 1)) * 100)}%)` },
      { param: 'Non-SFIT Participants Count', value: `${nonSfitStudents} (${Math.round((nonSfitStudents / (totalStudents || 1)) * 100)}%)` },
      { param: 'Confirmed Revenue Collected', value: `INR ${totalRev}` },
      { param: 'Export Generation Timestamp', value: new Date().toLocaleString() }
    ];

    metrics.forEach((m, idx) => {
      const row = overviewSheet.addRow(m);
      row.height = 22;
      this.applyDataCellStyles(row, idx % 2 === 1);
    });

    // Sheet 2: Teams
    const teamsSheet = workbook.addWorksheet('Teams Roster', { views: [{ showGridLines: true }] });
    this.populateTeamsSheet(teamsSheet);

    // Sheet 3: Participants
    const studentsSheet = workbook.addWorksheet('All Students & ID Cards', { views: [{ showGridLines: true }] });
    this.populateStudentsSheet(studentsSheet);

    // Sheet 4: Payments
    const paymentsSheet = workbook.addWorksheet('Payments & Invoices', { views: [{ showGridLines: true }] });
    this.populatePaymentsSheet(paymentsSheet);

    return workbook;
  }

  /**
   * Generates Teams List Workbook
   */
  async generateTeamsWorkbook() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DECEPTION Event Portal';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Teams List', { views: [{ showGridLines: true }] });
    this.populateTeamsSheet(sheet);
    return workbook;
  }

  /**
   * Generates Students List Workbook
   */
  async generateStudentsWorkbook() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DECEPTION Event Portal';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Students & ID Cards', { views: [{ showGridLines: true }] });
    this.populateStudentsSheet(sheet);
    return workbook;
  }

  /**
   * Generates Payments List Workbook
   */
  async generatePaymentsWorkbook() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DECEPTION Event Portal';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Payments & Receipts', { views: [{ showGridLines: true }] });
    this.populatePaymentsSheet(sheet);
    return workbook;
  }
}

export const excelService = new ExcelService();
export default excelService;
