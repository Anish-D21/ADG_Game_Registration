import React, { useState, useEffect } from 'react';
import { fetchRegistration, simulateMockPayment, submitManualUpi } from '../services/api.ts';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';
import { jsPDF } from 'jspdf';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  QrCode, 
  Download, 
  Mail, 
  CreditCard, 
  Printer, 
  Users, 
  MapPin, 
  Calendar,
  X,
  Sparkles
} from 'lucide-react';

interface RegistrationStatusPageProps {
  initialRegId?: string;
  setActiveTab: (tab: string) => void;
}

export const RegistrationStatusPage: React.FC<RegistrationStatusPageProps> = ({ initialRegId, setActiveTab }) => {
  const [searchId, setSearchId] = useState(initialRegId || 'GAME26-00101');
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Email Preview Modal
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Payment Modal if pending
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  useEffect(() => {
    if (initialRegId) {
      loadRegistration(initialRegId);
    } else {
      loadRegistration('GAME26-00101');
    }
  }, [initialRegId]);

  const loadRegistration = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchRegistration(id.trim());
      setRegistration(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration not found with that code.');
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRegistration(searchId);
  };

  // Instant Mock Pay handler from Status page
  const handleInstantPay = async () => {
    if (!registration) return;
    setPaymentActionLoading(true);
    try {
      await simulateMockPayment(registration.registrationId);
      await loadRegistration(registration.registrationId);
      setShowPaymentModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment simulation failed');
    } finally {
      setPaymentActionLoading(false);
    }
  };

  // Manual UPI submit handler from Status page
  const handleUpiSubmit = async () => {
    if (!registration) return;
    if (!utrInput.trim() || utrInput.trim().length < 6) {
      setErrorMsg('Please enter a valid 12-digit UPI UTR number.');
      return;
    }
    setPaymentActionLoading(true);
    try {
      await submitManualUpi(registration.registrationId, {
        transactionReference: utrInput.trim()
      });
      await loadRegistration(registration.registrationId);
      setShowPaymentModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit UPI UTR');
    } finally {
      setPaymentActionLoading(false);
    }
  };

  // Generate Combined PDF (Pass + Receipt)
  const downloadCombinedPdf = () => {
    if (!registration) return;

    const doc = new jsPDF();
    const primaryColor = '#E5005A';
    const darkColor = '#111827';

    // Header Background
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(247, 232, 181);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('DECEPTION 2026 — ENTRY PASS', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(0, 175, 198);
    doc.text('AI DEVELOPERS GROUP (ADG) x MosaIC • SFIT ROOM NO. 318', 14, 28);
    doc.text(`Dates: 16–17 October 2026`, 14, 34);

    // Registration Details Box
    doc.setDrawColor(17, 24, 39);
    doc.setLineWidth(0.8);
    doc.setFillColor(255, 253, 240);
    doc.roundedRect(14, 46, 182, 48, 2, 2, 'FD');

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(12);
    doc.text(`SQUAD: ${registration.teamName?.toUpperCase()}`, 20, 56);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Registration Code: ${registration.registrationId}`, 20, 64);
    doc.text(`Registration Status: ${registration.status}`, 20, 71);
    doc.text(`Payment Status: ${registration.payment?.status || 'PENDING'}`, 20, 78);
    doc.text(`Venue: SFIT Room No. 318 (Report at 09:30 AM)`, 20, 85);

    // QR Code Placement (if available)
    if (registration.ticket?.qrDataUrl) {
      try {
        doc.addImage(registration.ticket.qrDataUrl, 'PNG', 145, 48, 44, 44);
      } catch (e) {
        // In case image failed to add
      }
    }

    // Players Table Header
    doc.setFillColor(244, 196, 48);
    doc.rect(14, 102, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text('SQUAD ROSTER (STRICT SFIT VERIFICATION)', 18, 107.5);

    // Players List
    const players = registration.players || [];
    let startY = 118;
    players.forEach((p: any, idx: number) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${idx + 1}. ${p.fullName} (${p.studentId}) — ${p.email} [${p.branch}/${p.year}]`, 20, startY);
      startY += 7;
    });

    // Payment Receipt Section
    doc.setFillColor(0, 175, 198);
    doc.rect(14, startY + 5, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text('OFFICIAL PAYMENT RECEIPT', 18, startY + 10.5);

    const payment = registration.payment || {};
    startY += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Amount Paid: Rs. ${payment.amount || 500} ${payment.currency || 'INR'}`, 20, startY);
    doc.text(`Payment Gateway Ref / UTR: ${payment.transactionReference || 'N/A'}`, 20, startY + 7);
    doc.text(`Payment Method: ${payment.provider || 'MOCK'}`, 20, startY + 14);
    doc.text(`Receipt Date: ${new Date(payment.completedAt || Date.now()).toLocaleString()}`, 20, startY + 21);

    // Footer instructions
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Instructions: Present this digital or printed pass along with your SFIT college ID at Room 318.', 14, 280);
    doc.text('Issued by AI Developers Group (ADG). Fraudulent tickets will be disqualified.', 14, 285);

    doc.save(`${registration.registrationId}_CONFIRMATION.pdf`);
  };

  const isConfirmed = registration?.status === 'CONFIRMED' || registration?.payment?.status === 'PAID';
  const isPendingVerification = registration?.payment?.status === 'PENDING_VERIFICATION';
  const isPaymentPending = registration?.payment?.status === 'PENDING' || registration?.status === 'PENDING_PAYMENT';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Search Header */}
      <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[6px_6px_0_0_#111827] p-6 sm:p-8 space-y-4">
        <span className="bg-[#00AFC6] text-white font-pixel text-xs px-2.5 py-1 border-2 border-[#111827]">
          VERIFICATION PORTAL
        </span>
        <h1 className="font-pixel text-2xl sm:text-3xl text-[#111827] tracking-wider">
          REGISTRATION & PASS STATUS
        </h1>
        <p className="text-xs sm:text-sm font-body text-[#111827]/80">
          Enter your unique Registration Code (e.g. <span className="font-mono font-bold">GAME26-00101</span>) to view squad details, download your QR entry pass, and check payment status.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Registration Code (GAME26-XXXXX)"
            className="flex-1 px-4 py-3 bg-[#FFFDF0] border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] font-mono text-sm focus:outline-none uppercase"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#E5005A] text-white font-arcade text-xs sm:text-sm px-6 py-3 border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] flex items-center justify-center gap-2 hover:bg-[#111827] transition-colors disabled:opacity-50"
          >
            <Search className="w-4 h-4" /> {loading ? 'SEARCHING...' : 'CHECK STATUS'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-[#E5005A] text-white border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 shrink-0 text-[#F4C430]" />
          <div className="text-xs sm:text-sm font-arcade">{errorMsg}</div>
        </div>
      )}

      {/* Registration Details Card */}
      {registration && (
        <div className="space-y-6">
          {/* Status Header Banner */}
          <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[6px_6px_0_0_#111827] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#111827] pb-4">
              <div>
                <span className="font-pixel text-[10px] text-gray-500 uppercase">SQUAD REGISTRATION CODE</span>
                <div className="font-pixel text-xl sm:text-2xl text-[#E5005A] font-bold">
                  {registration.registrationId}
                </div>
                <h2 className="font-arcade text-lg sm:text-xl text-[#111827] font-bold mt-1">
                  {registration.teamName}
                </h2>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <div className="text-right">
                  <span className="text-[10px] font-pixel block text-gray-500">REGISTRATION STATUS</span>
                  <span className={`inline-block font-pixel text-xs px-2.5 py-1 border-2 border-[#111827] ${
                    isConfirmed ? 'bg-[#4CAF50] text-white' : 'bg-[#F4C430] text-[#111827]'
                  }`}>
                    {registration.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-pixel block text-gray-500">PAYMENT STATUS</span>
                  <span className={`inline-block font-pixel text-xs px-2.5 py-1 border-2 border-[#111827] ${
                    registration.payment?.status === 'PAID'
                      ? 'bg-[#4CAF50] text-white'
                      : isPendingVerification
                      ? 'bg-[#00AFC6] text-white'
                      : 'bg-[#E5005A] text-white'
                  }`}>
                    {registration.payment?.status || 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Quick Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-body pt-1">
              <div className="flex items-center gap-2 p-2.5 bg-[#F7E8B5] border-2 border-[#111827]">
                <Calendar className="w-4 h-4 text-[#E5005A]" />
                <span>{EVENT_CONFIG.eventDateDisplay}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-[#F7E8B5] border-2 border-[#111827]">
                <MapPin className="w-4 h-4 text-[#00AFC6]" />
                <span>{EVENT_CONFIG.venue}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-[#F7E8B5] border-2 border-[#111827]">
                <Users className="w-4 h-4 text-[#4CAF50]" />
                <span>{registration.players?.length || 5} Players Squad</span>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* CASE A: CONFIRMED PASS & QR TICKET */}
          {/* ---------------------------------------------------- */}
          {isConfirmed && (
            <div className="bg-[#111827] text-white border-4 border-[#111827] shadow-[6px_6px_0_0_#4CAF50] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-gray-700 pb-6">
                <div className="space-y-2 text-center sm:text-left">
                  <span className="bg-[#4CAF50] text-white font-pixel text-xs px-3 py-1 border border-white inline-block">
                    ✓ ACCESS GRANTED • ROOM 318
                  </span>
                  <h3 className="font-pixel text-xl sm:text-2xl text-[#F7E8B5]">
                    OFFICIAL TOURNAMENT ENTRY PASS
                  </h3>
                  <p className="text-xs text-gray-300 font-body max-w-md">
                    Present this pass on your phone or printout at the Room 318 entrance on 16 or 17 October. Proctors will scan the QR code to grant mission briefing kits.
                  </p>
                </div>

                {/* QR Ticket */}
                <div className="bg-white border-4 border-[#F4C430] p-3 shadow-[4px_4px_0_0_#000] flex flex-col items-center shrink-0">
                  {registration.ticket?.qrDataUrl ? (
                    <img
                      src={registration.ticket.qrDataUrl}
                      alt="DECEPTION Entry QR Pass"
                      className="w-36 h-36"
                    />
                  ) : (
                    <div className="w-36 h-36 bg-gray-100 flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-gray-800" />
                    </div>
                  )}
                  <span className="text-[9px] font-mono text-[#111827] font-bold mt-1">
                    {registration.registrationId}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadCombinedPdf}
                  className="bg-[#00AFC6] text-[#111827] font-arcade text-xs px-5 py-3 border-2 border-white shadow-[3px_3px_0_0_#FFF] hover:bg-white transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> DOWNLOAD COMBINED PDF PASS & RECEIPT
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="bg-[#F4C430] text-[#111827] font-arcade text-xs px-5 py-3 border-2 border-white shadow-[3px_3px_0_0_#FFF] hover:bg-white transition-all flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" /> VIEW IN-APP EMAIL DISPATCH
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* CASE B: PAYMENT PENDING VERIFICATION */}
          {/* ---------------------------------------------------- */}
          {isPendingVerification && (
            <div className="bg-[#FFFDF0] border-4 border-[#00AFC6] shadow-[6px_6px_0_0_#111827] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-[#00AFC6] animate-spin" />
                <h3 className="font-arcade text-base font-bold text-[#111827]">
                  UNDER VERIFICATION BY ADG DESK
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-body text-[#111827]/90 leading-relaxed">
                Your manual UPI transfer proof has been recorded. Reference UTR: <strong className="font-mono bg-[#F7E8B5] px-1">{registration.payment?.transactionReference}</strong>. An organizer will approve your payment shortly. You can re-check this page anytime.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => loadRegistration(registration.registrationId)}
                  className="bg-[#00AFC6] text-[#111827] font-arcade text-xs px-4 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827]"
                >
                  REFRESH STATUS
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* CASE C: PAYMENT NOT STARTED / PENDING */}
          {/* ---------------------------------------------------- */}
          {isPaymentPending && (
            <div className="bg-[#F7E8B5] border-4 border-[#E5005A] shadow-[6px_6px_0_0_#111827] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-[#E5005A]" />
                <h3 className="font-arcade text-base font-bold text-[#111827]">
                  PAYMENT PENDING (₹500)
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-body text-[#111827]/90 leading-relaxed">
                Squad registration has been initiated, but payment is not yet completed. Complete payment via instant mock testing or scan the UPI QR code to confirm your slot in Room 318.
              </p>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-[#E5005A] text-white font-arcade text-xs px-6 py-3 border-2 border-[#111827] shadow-[3px_3px_0_0_#111827] flex items-center gap-2 hover:bg-[#111827]"
              >
                <CreditCard className="w-4 h-4" /> COMPLETE SQUAD PAYMENT (₹500)
              </button>
            </div>
          )}

          {/* Roster & Verified Identity Cards */}
          <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[6px_6px_0_0_#111827] p-6 space-y-4">
            <h3 className="font-arcade text-base font-bold text-[#111827] border-b-2 border-[#111827] pb-2">
              SQUAD ROSTER & COLLEGE IDENTITY CARDS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {registration.players?.map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-[#F7E8B5] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] space-y-2 text-xs font-body"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-[10px] text-[#E5005A]">0{idx + 1}</span>
                    {idx === 0 && (
                      <span className="bg-[#111827] text-white font-pixel text-[8px] px-1.5 py-0.5">
                        LEADER
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-[#111827] truncate">{p.fullName}</div>
                  <div className="text-gray-600 font-mono text-[11px]">{p.studentId}</div>
                  <div className="text-[#00AFC6] font-mono text-[11px] truncate">{p.email}</div>
                  <div className="text-gray-700">{p.branch} • {p.year}</div>

                  {p.idCardUrl && (
                    <div className="pt-2">
                      <div className="w-full h-24 border border-[#111827] bg-white overflow-hidden">
                        <img
                          src={p.idCardUrl}
                          alt={`ID Card ${p.fullName}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* IN-APP EMAIL PREVIEW MODAL */}
      {/* ---------------------------------------------------- */}
      {showEmailModal && registration && (
        <div className="fixed inset-0 z-50 bg-[#111827]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[8px_8px_0_0_#000] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#111827] pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#E5005A]" />
                <h3 className="font-arcade text-base font-bold text-[#111827]">
                  IN-APP EMAIL DISPATCH PREVIEW
                </h3>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 border-2 border-[#111827] bg-[#F7E8B5] hover:bg-[#E5005A] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono space-y-1 bg-[#F7E8B5] p-3 border-2 border-[#111827]">
              <div><strong>To:</strong> {registration.contactEmail || registration.players?.[0]?.email}</div>
              <div><strong>From:</strong> tickets@deception.sfit.ac.in (ADG SFIT)</div>
              <div><strong>Subject:</strong> [CONFIRMED] DECEPTION Entry Pass & Receipt — {registration.registrationId}</div>
              <div><strong>Attachment:</strong> DECEPTION_ENTRY_PASS_{registration.registrationId}.png</div>
            </div>

            <div className="p-4 bg-white border-2 border-[#111827] text-xs font-body space-y-3 leading-relaxed">
              <p>Dear {registration.leaderName || 'Squad Leader'},</p>
              <p>
                Congratulations! Squad <strong>{registration.teamName}</strong> has been officially confirmed for <strong>DECEPTION 2026</strong>.
              </p>
              <div className="p-3 bg-[#F7E8B5]/50 border border-[#111827] space-y-1 font-mono">
                <div>• Registration Code: {registration.registrationId}</div>
                <div>• Squad Size: {registration.players?.length || 5} Players</div>
                <div>• Venue: Room No. 318, St. Francis Institute of Technology</div>
                <div>• Dates: 16–17 October 2026</div>
                <div>• Fee Status: PAID (Rs. 500)</div>
              </div>
              <p>
                Please ensure all squad members carry their physical or digital SFIT ID cards to the check-in desk at Room 318. Secret roles and tasks will be distributed upon scanning your QR pass.
              </p>
              <p className="text-gray-500 italic">
                "Trust no one. Complete your tasks. Watch the others."
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowEmailModal(false)}
                className="bg-[#111827] text-white font-arcade text-xs px-5 py-2.5 border-2 border-[#111827]"
              >
                CLOSE PREVIEW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* COMPLETE PAYMENT MODAL */}
      {/* ---------------------------------------------------- */}
      {showPaymentModal && registration && (
        <div className="fixed inset-0 z-50 bg-[#111827]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[8px_8px_0_0_#000] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#111827] pb-3">
              <h3 className="font-arcade text-base font-bold text-[#111827]">
                COMPLETE PAYMENT FOR {registration.registrationId}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 border-2 border-[#111827] bg-[#F7E8B5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-body">
              <div className="p-4 bg-[#F7E8B5] border-2 border-[#111827]">
                <h4 className="font-arcade text-xs font-bold text-[#111827] mb-1">
                  Option 1: Development Instant Pay
                </h4>
                <p className="text-gray-700 mb-3">
                  Simulate immediate gateway authorization without bank credentials.
                </p>
                <button
                  onClick={handleInstantPay}
                  disabled={paymentActionLoading}
                  className="w-full bg-[#4CAF50] text-white font-arcade text-xs py-2.5 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827]"
                >
                  {paymentActionLoading ? 'PROCESSING...' : 'INSTANT MOCK PAY (₹500)'}
                </button>
              </div>

              <div className="p-4 bg-white border-2 border-[#111827] space-y-2">
                <h4 className="font-arcade text-xs font-bold text-[#111827]">
                  Option 2: Enter UPI UTR Reference
                </h4>
                <p className="text-gray-700">UPI ID: adg.deception@sbi</p>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="Enter 12-digit UTR (e.g. 426189012345)"
                  className="w-full px-3 py-2 bg-[#F7E8B5] border-2 border-[#111827] font-mono text-xs"
                />
                <button
                  onClick={handleUpiSubmit}
                  disabled={paymentActionLoading}
                  className="w-full bg-[#E5005A] text-white font-arcade text-xs py-2.5 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827]"
                >
                  {paymentActionLoading ? 'SUBMITTING...' : 'SUBMIT UTR NUMBER'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationStatusPage;
