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
    
    // In production with CLOUDINARY_API_KEY, upload to Cloudinary;
    // In local dev, store as secure dataUrl or local asset link
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const url = dataUrl || `https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80`;

    const docRecord = {
      _id: docId,
      documentType,
      referenceId: req.body.referenceId || docId,
      ownerName: ownerName || 'Participant',
      url,
      publicId: `uploads/${fileName || 'file'}`,
      mimeType: fileType || 'image/jpeg',
      createdAt: new Date()
    };

    store.documents.push(docRecord);

    return res.json({
      success: true,
      url,
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
router.get('/admin/export/all', exportAllExcel);
router.get('/admin/export/excel', exportAllExcel);
router.get('/admin/export/teams', exportTeamsExcel);
router.get('/admin/exports/teams', exportTeamsExcel);
router.get('/admin/export/students', exportStudentsExcel);
router.get('/admin/export/payments', exportPaymentsExcel);
router.get('/admin/audit-logs', authenticateAdmin, getAuditLogs);
router.get('/admin/email-logs', authenticateAdmin, getEmailLogs);

export default router;
