/**
 * @file apiRoutes.js
 * @description Master Express Router for DECEPTION Platform APIs
 */

import express from 'express';
import { getGameInfo, createRegistration, getRegistration, getTicketInfo } from '../controllers/registrationController.js';
import { createPaymentOrder, getPaymentStatus, submitManualUpi, simulateMockPayment, handlePaymentWebhook } from '../controllers/paymentController.js';
import { 
  adminLogin, 
  getDashboardStats, 
  getAdminRegistrations, 
  getAdminStudents, 
  getAdminTeams, 
  getAdminPayments, 
  verifyPayment, 
  rejectPayment, 
  exportAllExcel,
  exportTeamsExcel,
  exportStudentsExcel,
  exportPaymentsExcel,
  getAuditLogs,
  getEmailLogs
} from '../controllers/adminController.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { store } from '../store/dataStore.js';

const router = express.Router();

// ==========================================
// 1. PUBLIC GAME & EVENT ROUTES
// ==========================================
router.get('/games', getGameInfo);
router.get('/games/:slug', getGameInfo);

// ==========================================
// 2. PUBLIC REGISTRATION ROUTES
// ==========================================
router.post('/registrations', createRegistration);
router.get('/registrations/:id', getRegistration);

// ==========================================
// 3. PUBLIC PAYMENT ROUTES (Contract Boundary)
// ==========================================
router.post('/payments/create', createPaymentOrder);
router.get('/payments/:registrationId', getPaymentStatus);
router.post('/payments/:registrationId/manual-upi', submitManualUpi);
router.post('/payments/:registrationId/mock-pay', simulateMockPayment);
router.post('/payments/webhook', handlePaymentWebhook);

// ==========================================
// 4. PUBLIC TICKET & PASS ROUTES
// ==========================================
router.get('/tickets/:registrationId', getTicketInfo);

// ==========================================
// 5. DOCUMENT UPLOAD (Cloudinary / File simulation)
// ==========================================
router.post('/documents/upload', (req, res) => {
  try {
    const { fileName, fileType, dataUrl, ownerName, documentType = 'ID_CARD' } = req.body;

    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'An image file is required.' });
    }

    // Only allow real images. Anything else is either a mistake or an attempt to
    // park arbitrary content in the store.
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    const header = dataUrl.slice(0, 64).match(/^data:([^;]+);base64,/);
    if (!header || !ALLOWED.includes(header[1].toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Unsupported file type. Please upload a JPG, PNG or WEBP image.`
      });
    }

    // Cap the payload. Uploads are held in memory, so without a limit a handful of
    // large files can exhaust the process.
    const MAX_BYTES = 5 * 1024 * 1024;
    const approxBytes = Math.floor((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
    if (approxBytes > MAX_BYTES) {
      return res.status(413).json({
        success: false,
        message: `File is too large (${(approxBytes / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`
      });
    }

    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const docRecord = {
      _id: docId,
      documentType,
      referenceId: req.body.referenceId || docId,
      ownerName: ownerName || 'Participant',
      url: dataUrl,
      publicId: `uploads/${fileName || 'file'}`,
      mimeType: header[1],
      sizeBytes: approxBytes,
      createdAt: new Date()
    };

    store.documents.push(docRecord);

    return res.json({
      success: true,
      url: docRecord.url,
      publicId: docRecord.publicId,
      document: docRecord
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. ADMIN AUTHENTICATION
// ==========================================
router.post('/admin/login', adminLogin);

// ==========================================
// 7. PROTECTED ADMIN PORTAL ROUTES
// ==========================================
router.get('/admin/dashboard', authenticateAdmin, getDashboardStats);
router.get('/admin/registrations', authenticateAdmin, getAdminRegistrations);
router.get('/admin/students', authenticateAdmin, getAdminStudents);
router.get('/admin/teams', authenticateAdmin, getAdminTeams);
router.get('/admin/payments', authenticateAdmin, getAdminPayments);
router.post('/admin/payments/:paymentId/verify', authenticateAdmin, verifyPayment);
router.post('/admin/payments/:paymentId/reject', authenticateAdmin, rejectPayment);
router.get('/admin/export/all', authenticateAdmin, exportAllExcel);
router.get('/admin/export/excel', authenticateAdmin, exportAllExcel);
router.get('/admin/export/teams', authenticateAdmin, exportTeamsExcel);
router.get('/admin/exports/teams', authenticateAdmin, exportTeamsExcel);
router.get('/admin/export/students', authenticateAdmin, exportStudentsExcel);
router.get('/admin/export/payments', authenticateAdmin, exportPaymentsExcel);
router.get('/admin/audit-logs', authenticateAdmin, getAuditLogs);
router.get('/admin/email-logs', authenticateAdmin, getEmailLogs);

export default router;
