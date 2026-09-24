import React, { useState, useEffect } from 'react';
import { fetchGameInfo } from '../services/api.ts';
import { useEventConfig } from '../services/useEventConfig.ts';
import { 
  createRegistration, 
  uploadDocument, 
  simulateMockPayment, 
  submitManualUpi,
  createPaymentOrder
} from '../services/api.ts';
import QRCode from 'qrcode';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';
import { 
  Users, 
  UserCheck, 
  Upload, 
  CheckCircle2, 
  CreditCard, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  QrCode,
  GraduationCap,
  Building2
} from 'lucide-react';

interface PlayerFormData {
  fullName: string;
  studentId: string;
  email: string;
  mobile: string;
  gender: string;
  branch: string;
  year: string;
  isSfit: boolean;
  collegeType: 'SFIT' | 'NON_SFIT';
  college: string;
  idCardUrl: string;
  idCardPublicId: string;
}

const defaultPlayer = (isSfit: boolean = true): PlayerFormData => ({
  fullName: '',
  studentId: '',
  email: '',
  mobile: '',
  gender: 'Male',
  branch: 'CMPN',
  year: 'TE',
  isSfit,
  collegeType: isSfit ? 'SFIT' : 'NON_SFIT',
  college: isSfit ? 'St. Francis Institute of Technology (SFIT)' : '',
  idCardUrl: '',
  idCardPublicId: ''
});

interface RegistrationPageProps {
  onSuccess: (registrationId: string) => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [teamSize, setTeamSize] = useState<5 | 6>(5);
  const [players, setPlayers] = useState<PlayerFormData[]>([
    defaultPlayer(true),
    defaultPlayer(true),
    defaultPlayer(true),
    defaultPlayer(true),
    defaultPlayer(true)
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRegistration, setCreatedRegistration] = useState<any>(null);
  // Real payment details from the server: the UPI target, the deep-link URI and a
  // scannable QR built from it. Never hardcode a VPA in the UI - if it drifts from
  // the configured one, students pay into an address nobody owns.
  const [payOrder, setPayOrder] = useState<any>(null);
  const [qrImage, setQrImage] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Step 5 Payment State
  const { payment: payCfg, money } = useEventConfig();
  const [paymentMethod, setPaymentMethod] = useState<'MOCK' | 'MANUAL_UPI'>('MANUAL_UPI');
  const [mockEnabled, setMockEnabled] = useState(false);

  // The server decides whether the mock path exists at all. In production it does not,
  // so the option must never be offered - it would hand out free confirmed tickets.
  useEffect(() => {
    fetchGameInfo()
      .then(res => {
        const enabled = Boolean(res?.paymentConfig?.mockEnabled);
        setMockEnabled(enabled);
        if (!enabled) setPaymentMethod('MANUAL_UPI');
      })
      .catch(() => setMockEnabled(false));
  }, []);
  const [utrNumber, setUtrNumber] = useState('');
  const [utrProofUrl, setUtrProofUrl] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  // Which player's ID card is currently being sent. Uploads round-trip to Drive and
  // a real ID photo is a few MB, so without this the card sits silent for seconds
  // and students assume it has hung.
  const [uploadingIds, setUploadingIds] = useState<Record<number, boolean>>({});
  const [proofName, setProofName] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [paySummary, setPaySummary] = useState<any>(null);

  // Handle Team Size change (5 or 6)
  const handleTeamSizeChange = (newSize: 5 | 6) => {
    setTeamSize(newSize);
    if (newSize === 6 && players.length === 5) {
      setPlayers([...players, defaultPlayer(true)]);
    } else if (newSize === 5 && players.length === 6) {
      setPlayers(players.slice(0, 5));
    }
  };

  // Update specific player field
  const updatePlayerField = (idx: number, field: keyof PlayerFormData, val: any) => {
    // Functional update: the ID card uploads all resolve asynchronously, and copying
    // `players` from the closure meant each callback wrote over the others' results.
    // Only the last upload survived, so the form blocked at step 3 insisting a card
    // was missing for a player who had just uploaded one.
    setPlayers(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
    setErrorMsg(null);
  };

  // Switch student between SFIT and Non-SFIT
  const setPlayerCollegeType = (idx: number, isSfit: boolean) => {
    // Functional update for the same reason as updatePlayerField: a copy taken from
    // the closure loses any change that landed between render and commit.
    setPlayers(prev => {
      const updated = [...prev];
      const current = updated[idx];
      updated[idx] = {
        ...current,
        isSfit,
        collegeType: isSfit ? 'SFIT' : 'NON_SFIT',
        college: isSfit
          ? 'St. Francis Institute of Technology (SFIT)'
          : (current.college === 'St. Francis Institute of Technology (SFIT)' || current.college === 'SFIT' ? '' : current.college)
      };
      return updated;
    });
    setErrorMsg(null);
  };

  // Validate standard email format (any active email works for Non-SFIT)
  const isValidGeneralEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  // Validate SFIT Email
  const isSfitEmail = (email: string) => {
    return email.trim().toLowerCase().endsWith(EVENT_CONFIG.participantConfig.collegeEmailDomain.toLowerCase());
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!teamName.trim() || teamName.trim().length < 2) {
      setErrorMsg('Team name is required (minimum 2 characters).');
      return false;
    }
    if (teamSize !== 5 && teamSize !== 6) {
      setErrorMsg('Team size must be strictly 5 or 6 players.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  // Step 2 Validation (Player Details with per-student SFIT vs Non-SFIT checks)
  const validateStep2 = () => {
    const emails = new Set<string>();
    const studentIds = new Set<string>();

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const pNum = i + 1;
      const playerTag = p.fullName.trim() ? `Player ${pNum} (${p.fullName.trim()})` : `Player ${pNum}`;

      if (!p.fullName.trim()) {
        setErrorMsg(`${playerTag}: Full Name is required.`);
        return false;
      }
      if (!p.studentId.trim()) {
        setErrorMsg(`${playerTag}: Student ID / Roll No is required.`);
        return false;
      }

      // Check Non-SFIT College Name requirement
      if (!p.isSfit) {
        if (!p.college || !p.college.trim()) {
          setErrorMsg(`${playerTag}: Please enter the College / University Name for this Non-SFIT participant.`);
          return false;
        }
      }

      if (!p.email.trim()) {
        setErrorMsg(`${playerTag}: Email address is required.`);
        return false;
      }

      // Per-student Email Rules:
      // If SFIT student: strictly requires @student.sfit.ac.in
      // If Non-SFIT student: any valid email format works!
      if (p.isSfit) {
        if (!isSfitEmail(p.email)) {
          setErrorMsg(
            `${playerTag}: Since this player is selected as an SFIT Student, email MUST end with ${EVENT_CONFIG.participantConfig.collegeEmailDomain}. If this student is from another college, please select "Non-SFIT Student" above.`
          );
          return false;
        }
      } else {
        if (!isValidGeneralEmail(p.email)) {
          setErrorMsg(
            `${playerTag}: Please enter a valid email address (e.g. name@example.com). Any active email works for Non-SFIT students.`
          );
          return false;
        }
      }

      if (!p.mobile.trim() || p.mobile.trim().length < 10) {
        setErrorMsg(`${playerTag}: A valid 10-digit mobile number is required.`);
        return false;
      }

      const normEmail = p.email.trim().toLowerCase();
      const normId = p.studentId.trim().toUpperCase();

      if (emails.has(normEmail)) {
        setErrorMsg(`Duplicate email within squad: "${normEmail}". Each player must have a unique email.`);
        return false;
      }
      if (studentIds.has(normId)) {
        setErrorMsg(`Duplicate Student ID within squad: "${normId}". Each player must have a unique student ID.`);
        return false;
      }

      emails.add(normEmail);
      studentIds.add(normId);
    }

    setErrorMsg(null);
    return true;
  };

  // Step 3 Validation (Documents)
  const uploadsInFlight = Object.values(uploadingIds).some(Boolean);

  const validateStep3 = () => {
    if (uploadsInFlight) {
      setErrorMsg('Please wait — ID cards are still uploading.');
      return false;
    }
    for (let i = 0; i < players.length; i++) {
      if (!players[i].idCardUrl) {
        // Warning or prompt for ID Card upload
        setErrorMsg(`Player ${i + 1} (${players[i].fullName || 'Player'}): College ID card upload is required.`);
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  // Handle ID card simulated/real file upload
  const handleIdCardFileChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(`File too large for Player ${idx + 1}. Maximum size is 5MB.`);
      return;
    }

    setUploadingIds(prev => ({ ...prev, [idx]: true }));
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const uploadRes = await uploadDocument({
          fileName: file.name,
          fileType: file.type,
          dataUrl,
          ownerName: players[idx].fullName || `Player ${idx + 1}`,
          // Names the file usefully in Drive. Empty before the squad is created,
          // which is fine - the player's name still identifies it.
          registrationId: createdRegistration?.registrationId || teamName || ''
        });

        updatePlayerField(idx, 'idCardUrl', uploadRes.url);
        updatePlayerField(idx, 'idCardPublicId', uploadRes.publicId);
      } catch (err: any) {
        // Fallback to dataUrl directly
        updatePlayerField(idx, 'idCardUrl', dataUrl);
      } finally {
        setUploadingIds(prev => ({ ...prev, [idx]: false }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Payment screenshot. Goes through the same upload endpoint as the ID cards, so it
  // lands in Drive when that is configured and stays inline when it is not.
  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Screenshot is too large. Maximum size is 5MB.');
      return;
    }
    setProofUploading(true);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        const res = await uploadDocument({
          fileName: file.name,
          fileType: file.type,
          dataUrl,
          ownerName: payerName.trim() || 'Payment proof',
          registrationId: createdRegistration?.registrationId || ''
        });
        setUtrProofUrl(res.url);
        setProofName(file.name);
      } catch {
        // Keep the image itself rather than losing the evidence entirely.
        setUtrProofUrl(dataUrl);
        setProofName(file.name);
      } finally {
        setProofUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Ask the server for the payment details once the squad exists, then render the QR
  // from exactly the string a UPI app will read - so what is scanned and what is
  // configured can never disagree.
  useEffect(() => {
    if (!createdRegistration?.registrationId || payOrder) return;
    let alive = true;
    createPaymentOrder({
      registrationId: createdRegistration.registrationId,
      preferredMethod: 'MANUAL_UPI'
    })
      .then((order) => { if (alive && order?.vpa) setPayOrder(order); })
      .catch(() => {});
    return () => { alive = false; };
  }, [createdRegistration, payOrder]);

  const copyVpa = () => {
    if (!payOrder?.vpa) return;
    navigator.clipboard?.writeText(payOrder.vpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 1800);
  };

  // A phone cannot scan its own screen, so the deep links are the primary path on
  // mobile and the QR is for someone paying from a second device.
  // The amount MUST be in the intent or UPI apps reject it, and it has to reflect the
  // share this person is actually sending - so build the link from what they typed.
  const payNow = Number(paidAmount) > 0
    ? Number(paidAmount)
    : payCfg.perHeadAmount * (players.length || 0);

  const upiUri = payOrder?.vpa
    ? `upi://pay?pa=${payOrder.vpa}` +
      `&pn=${encodeURIComponent(payOrder.payeeName || 'ADG DECEPTION')}` +
      (payNow > 0 ? `&am=${payNow.toFixed(2)}` : '') +
      `&cu=INR&tn=${encodeURIComponent(payOrder.note || '')}`
    : '';

  useEffect(() => {
    if (!upiUri) { setQrImage(''); return; }
    let alive = true;
    QRCode.toDataURL(upiUri, { width: 320, margin: 1 })
      .then(u => { if (alive) setQrImage(u); })
      .catch(() => { if (alive) setQrImage(''); });
    return () => { alive = false; };
  }, [upiUri]);

  // The plain upi:// intent is the one verified against a real payment; the branded
  // schemes are a convenience and must never be the only route offered.
  const upiApps = upiUri
    ? [
        { label: 'Google Pay', href: upiUri.replace('upi://', 'tez://upi/') },
        { label: 'PhonePe', href: upiUri.replace('upi://', 'phonepe://') },
        { label: 'Paytm', href: upiUri.replace('upi://', 'paytmmp://') }
      ]
    : [];

  // Step Navigation
  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit Registration (Step 4 -> Step 5)
  const handleSubmitRegistration = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        teamName: teamName.trim(),
        players,
        preferredMethod: paymentMethod
      };

      const result = await createRegistration(payload);
      setCreatedRegistration(result.registration);
      setCurrentStep(5);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check form details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant Mock Payment
  const handleMockPayment = async () => {
    if (!createdRegistration) return;
    setPaymentLoading(true);
    try {
      await simulateMockPayment(createdRegistration.registrationId);
      onSuccess(createdRegistration.registrationId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment simulation failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Manual UPI Submission. Members may pay separately, so this can be run several
  // times for one squad - the form stays open until the total is covered.
  const handleManualUpiSubmit = async () => {
    if (!createdRegistration) return;
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setErrorMsg('Please enter a valid 12-digit UPI UTR number or bank transaction ID.');
      return;
    }
    const amt = Number(paidAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setErrorMsg('Please enter how much you paid, in rupees.');
      return;
    }

    setPaymentLoading(true);
    setErrorMsg(null);
    try {
      const res = await submitManualUpi(createdRegistration.registrationId, {
        transactionReference: utrNumber.trim(),
        amount: amt,
        payerName: payerName.trim(),
        // Proves the submission belongs to this squad. Taken from the form, so the
        // student never has to type it again here.
        contactEmail: createdRegistration?.contactEmail || players[0]?.email || '',
        evidenceUrl: utrProofUrl || ''
      });
      setPaySummary(res);
      setUtrNumber('');
      setPaidAmount('');
      setPayerName('');
      // Only move on once the whole squad is covered.
      if (res.fullyPaid) onSuccess(createdRegistration.registrationId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit UTR reference');
    } finally {
      setPaymentLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Team Setup', icon: Users },
    { num: 2, title: 'Player Details', icon: UserCheck },
    { num: 3, title: 'College IDs', icon: Upload },
    { num: 4, title: 'Review', icon: CheckCircle2 },
    { num: 5, title: 'Payment', icon: CreditCard }
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Title Header */}
      <div className="bg-[#FFFDF0] border-3 sm:border-4 border-[#111827] shadow-[4px_4px_0_0_#111827] sm:shadow-[6px_6px_0_0_#111827] p-4 sm:p-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="bg-[#E5005A] text-white font-pixel text-[10px] sm:text-xs px-2.5 py-0.5 sm:py-1 border-2 border-[#111827] inline-block">
            ROOM 318 ENTRANCE
          </span>
          <h1 className="font-pixel text-xl sm:text-3xl text-[#111827] mt-2 tracking-wider">
            SQUAD REGISTRATION
          </h1>
          <p className="text-xs sm:text-sm font-body text-[#111827]/80 mt-1">
            Official pass registration for DECEPTION • Strict 5 or 6 SFIT players
          </p>
        </div>
        <div className="w-full sm:w-auto bg-[#00AFC6] text-white font-pixel text-xs px-3.5 sm:px-4 py-2 border-2 sm:border-3 border-[#111827] shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827] flex sm:flex-col items-center justify-between sm:justify-center text-center shrink-0">
          <div>ENTRY FEE</div>
          <div className="text-base font-bold">{money(payCfg.perHeadAmount)} / PLAYER</div>
        </div>
      </div>

      {/* Visual Stepper */}
      <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] sm:shadow-[4px_4px_0_0_#111827] p-3 sm:p-4">
        {/* Mobile View (< sm): Non-overflowing 5-node tracker + active step banner */}
        <div className="block sm:hidden">
          <div className="flex items-center justify-between relative px-1">
            {steps.map((s, idx) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;

              return (
                <React.Fragment key={s.num}>
                  <div
                    className={`w-7 h-7 border-2 border-[#111827] flex items-center justify-center font-pixel text-[10px] z-10 transition-all ${
                      isDone
                        ? 'bg-[#4CAF50] text-white shadow-[1px_1px_0_0_#111827]'
                        : isCurrent
                        ? 'bg-[#E5005A] text-white shadow-[2px_2px_0_0_#111827] scale-105 font-bold'
                        : 'bg-[#F7E8B5] text-[#111827]'
                    }`}
                  >
                    {isDone ? '✓' : s.num}
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 border-t-2 ${
                        currentStep > idx + 1 ? 'border-[#4CAF50]' : 'border-dashed border-[#111827]'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {/* Active step descriptor for mobile */}
          <div className="mt-2.5 pt-2 border-t border-[#111827]/20 flex items-center justify-between text-xs">
            <span className="font-arcade text-[#E5005A] font-bold flex items-center gap-1.5">
              <span>STEP {currentStep} OF 5:</span>
              <span className="text-[#111827]">{steps[currentStep - 1]?.title}</span>
            </span>
            <span className="font-pixel text-[9px] bg-[#111827] text-white px-1.5 py-0.5">
              {Math.round(((currentStep - 1) / 4) * 100)}%
            </span>
          </div>
        </div>

        {/* Tablet & Desktop View (>= sm): Full step nodes with icons */}
        <div className="hidden sm:flex items-center justify-between">
          {steps.map((s, idx) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 border-2 border-[#111827] flex items-center justify-center font-pixel text-xs transition-all ${
                      isDone
                        ? 'bg-[#4CAF50] text-white shadow-[2px_2px_0_0_#111827]'
                        : isCurrent
                        ? 'bg-[#E5005A] text-white shadow-[3px_3px_0_0_#111827] scale-105'
                        : 'bg-[#F7E8B5] text-[#111827]'
                    }`}
                  >
                    {isDone ? '✓' : s.num}
                  </div>
                  <div>
                    <span className={`block font-arcade text-xs ${isCurrent ? 'font-bold text-[#111827]' : 'text-gray-600'}`}>
                      {s.title}
                    </span>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 border-t-2 border-[#111827] ${isDone ? 'border-[#4CAF50]' : 'border-dashed'}`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Alert Display */}
      {errorMsg && (
        <div className="p-3.5 sm:p-4 bg-[#E5005A] text-white border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] sm:shadow-[4px_4px_0_0_#111827] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-[#F4C430]" />
          <div className="text-xs sm:text-sm font-arcade tracking-wide leading-relaxed">
            {errorMsg}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 1: TEAM CONFIGURATION */}
      {/* ---------------------------------------------------- */}
      {currentStep === 1 && (
        <div className="bg-[#FFFDF0] border-3 sm:border-4 border-[#111827] shadow-[4px_4px_0_0_#111827] sm:shadow-[6px_6px_0_0_#111827] p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="border-b-2 border-[#111827] pb-3">
            <h2 className="font-arcade text-lg sm:text-xl text-[#111827] font-bold">
              STEP 1: SQUAD DETAILS
            </h2>
            <p className="text-xs font-body text-[#111827]/80">
              Choose your squad name and select squad size (strictly 5 or 6 participants).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-arcade text-xs font-bold text-[#111827] mb-1 uppercase tracking-wider">
                Squad / Team Name *
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => { setTeamName(e.target.value); setErrorMsg(null); }}
                placeholder="e.g. The Suspects, Room 318 Crew, Binary Imposters"
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[#FFFDF0] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827] font-body text-xs sm:text-sm focus:outline-none focus:bg-[#FFF]"
              />
            </div>

            <div>
              <label className="block font-arcade text-xs font-bold text-[#111827] mb-2 uppercase tracking-wider">
                Strict Squad Size (Min 5, Max 6) *
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md">
                <button
                  type="button"
                  onClick={() => handleTeamSizeChange(5)}
                  className={`p-3 sm:p-4 border-2 sm:border-3 border-[#111827] text-left transition-all ${
                    teamSize === 5
                      ? 'bg-[#00AFC6] text-white shadow-[3px_3px_0_0_#111827] sm:shadow-[4px_4px_0_0_#111827]'
                      : 'bg-[#F7E8B5] text-[#111827] hover:bg-[#FFFDF0]'
                  }`}
                >
                  <div className="font-pixel text-sm sm:text-xl mb-1">5 PLAYERS</div>
                  <div className="text-[11px] sm:text-xs font-body opacity-90">1 Leader + 4 Crewmates</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTeamSizeChange(6)}
                  className={`p-3 sm:p-4 border-2 sm:border-3 border-[#111827] text-left transition-all ${
                    teamSize === 6
                      ? 'bg-[#E5005A] text-white shadow-[3px_3px_0_0_#111827] sm:shadow-[4px_4px_0_0_#111827]'
                      : 'bg-[#F7E8B5] text-[#111827] hover:bg-[#FFFDF0]'
                  }`}
                >
                  <div className="font-pixel text-sm sm:text-xl mb-1">6 PLAYERS</div>
                  <div className="text-[11px] sm:text-xs font-body opacity-90">1 Leader + 5 Crewmates</div>
                </button>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-[#F7E8B5] border-2 border-[#111827] text-xs font-body space-y-1">
              <strong className="font-arcade text-[#E5005A] block">Important Note on Eligibility:</strong>
              <p>• Both SFIT and Non-SFIT students are eligible to register and participate.</p>
              <p>• In the next step, select whether each player is an <strong>SFIT Student</strong> (requires @student.sfit.ac.in email) or a <strong>Non-SFIT Student</strong> (any email accepted).</p>
              <p>• Player 1 will be designated as the Team Leader and will receive entry passes & communication.</p>
            </div>
          </div>

          <div className="flex justify-end pt-3 sm:pt-4">
            <button
              onClick={nextStep}
              className="w-full sm:w-auto bg-[#111827] text-white font-arcade text-xs sm:text-sm px-6 py-3.5 border-2 border-[#111827] shadow-[3px_3px_0_0_#E5005A] flex items-center justify-center gap-2 hover:bg-[#E5005A] transition-colors"
            >
              <span>PROCEED TO PLAYER DETAILS</span> <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 2: PLAYER DETAILS */}
      {/* ---------------------------------------------------- */}
      {currentStep === 2 && (
        <div className="space-y-5 sm:space-y-6">
          <div className="bg-[#FFFDF0] border-3 sm:border-4 border-[#111827] shadow-[4px_4px_0_0_#111827] sm:shadow-[6px_6px_0_0_#111827] p-4 sm:p-8">
            <div className="border-b-2 border-[#111827] pb-3 mb-4 sm:mb-6">
              <h2 className="font-arcade text-lg sm:text-xl text-[#111827] font-bold">
                STEP 2: ROSTER DETAILS ({players.length} PLAYERS)
              </h2>
              <p className="text-xs font-body text-[#111827]/80">
                For each player, select their college type first. SFIT students require an official <strong className="font-mono">@student.sfit.ac.in</strong> email; Non-SFIT students can register with any valid email.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {players.map((p, idx) => {
                const isLeader = idx === 0;
                const sfitEmailValid = isSfitEmail(p.email);
                const generalEmailValid = isValidGeneralEmail(p.email);

                return (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-5 border-2 sm:border-3 border-[#111827] bg-[#F7E8B5]/60 shadow-[3px_3px_0_0_#111827] sm:shadow-[4px_4px_0_0_#111827] space-y-3 sm:space-y-4"
                  >
                    {/* Header bar with Player #, Leader Tag, and Status */}
                    <div className="flex items-center justify-between border-b border-[#111827] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 bg-[#111827] text-white font-pixel text-[10px] sm:text-xs flex items-center justify-center shrink-0">
                          0{idx + 1}
                        </span>
                        <h3 className="font-arcade text-xs sm:text-sm font-bold text-[#111827] truncate">
                          {isLeader ? 'PLAYER 01 (LEADER)' : `PLAYER 0${idx + 1}`}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {isLeader && (
                          <span className="bg-[#E5005A] text-white font-pixel text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 border border-[#111827]">
                            LEADER
                          </span>
                        )}
                        <span className={`font-pixel text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 border border-[#111827] ${
                          p.isSfit ? 'bg-[#F4C430] text-[#111827]' : 'bg-[#00AFC6] text-white'
                        }`}>
                          {p.isSfit ? 'SFIT' : 'NON-SFIT'}
                        </span>
                      </div>
                    </div>

                    {/* Dedicated Per-Student Option: SFIT Student vs Non-SFIT Student */}
                    <div className="p-3 bg-[#FFFDF0] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <label className="font-arcade text-xs font-bold text-[#111827] flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-[#E5005A] shrink-0" />
                          COLLEGE SELECTION FOR PLAYER 0{idx + 1} *
                        </label>
                        <span className="text-[10px] font-body text-gray-600">
                          Select before entering email address
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {/* Option 1: SFIT Student */}
                        <button
                          type="button"
                          onClick={() => setPlayerCollegeType(idx, true)}
                          className={`p-2.5 sm:p-3 border-2 border-[#111827] text-left transition-all flex items-start gap-2.5 ${
                            p.isSfit
                              ? 'bg-[#F4C430] text-[#111827] shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827]'
                              : 'bg-white text-gray-700 hover:bg-[#F7E8B5]'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 border-[#111827] flex items-center justify-center shrink-0 mt-0.5 ${
                            p.isSfit ? 'bg-[#111827]' : 'bg-white'
                          }`}>
                            {p.isSfit && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-arcade text-xs font-bold text-[#111827] flex items-center gap-1.5">
                              SFIT Student
                              {p.isSfit && <span className="bg-[#111827] text-white font-pixel text-[8px] px-1 py-0.2">ACTIVE</span>}
                            </div>
                            <div className="text-[10px] sm:text-[11px] font-body text-gray-700 mt-0.5 leading-snug">
                              St. Francis Inst. of Tech • <strong>@student.sfit.ac.in email only</strong>
                            </div>
                          </div>
                        </button>

                        {/* Option 2: Non-SFIT Student */}
                        <button
                          type="button"
                          onClick={() => setPlayerCollegeType(idx, false)}
                          className={`p-2.5 sm:p-3 border-2 border-[#111827] text-left transition-all flex items-start gap-2.5 ${
                            !p.isSfit
                              ? 'bg-[#00AFC6] text-white shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827]'
                              : 'bg-white text-gray-700 hover:bg-[#F7E8B5]'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 border-[#111827] flex items-center justify-center shrink-0 mt-0.5 ${
                            !p.isSfit ? 'bg-[#111827]' : 'bg-white'
                          }`}>
                            {!p.isSfit && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-arcade text-xs font-bold flex items-center gap-1.5 ${!p.isSfit ? 'text-white' : 'text-[#111827]'}`}>
                              Non-SFIT Student
                              {!p.isSfit && <span className="bg-[#111827] text-[#00AFC6] font-pixel text-[8px] px-1 py-0.2">ACTIVE</span>}
                            </div>
                            <div className={`text-[10px] sm:text-[11px] font-body mt-0.5 leading-snug ${!p.isSfit ? 'text-white/90' : 'text-gray-700'}`}>
                              External College • <strong>Any email accepted (Gmail, Yahoo, etc.)</strong>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs font-body">
                      {/* Full Name */}
                      <div>
                        <label className="block font-arcade text-[11px] font-bold text-[#111827] mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={p.fullName}
                          onChange={(e) => updatePlayerField(idx, 'fullName', e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-3 py-2 bg-[#FFFDF0] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] text-xs focus:outline-none"
                        />
                      </div>

                      {/* College / Institute Name */}
                      {!p.isSfit ? (
                        <div>
                          <label className="block font-arcade text-[11px] font-bold text-[#111827] mb-1">
                            College / Institute Name *
                          </label>
                          <input
                            type="text"
                            value={p.college}
                            onChange={(e) => updatePlayerField(idx, 'college', e.target.value)}
                            placeholder="e.g. VJTI, DJ Sanghvi, NMIMS"
                            className="w-full px-3 py-2 bg-[#FFFDF0] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] text-xs focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block font-arcade text-[11px] font-bold text-[#111827] mb-1">
                            College Name
                          </label>
                          <input
                            type="text"
                            disabled
                            value="St. Francis Institute of Technology (SFIT)"
                            className="w-full px-3 py-2 bg-[#F7E8B5] border-2 border-[#111827] text-xs font-arcade text-gray-700 cursor-not-allowed truncate"
                          />
                        </div>
                      )}

                      {/* Student ID / Roll No */}
                      <div>
                        <label className="block font-arcade text-[11px] font-bold text-[#111827] mb-1">
                          {p.isSfit ? 'SFIT Roll No / Student ID *' : 'College Roll No / Student ID *'}
                        </label>
                        <input
                          type="text"
                          value={p.studentId}
                          onChange={(e) => updatePlayerField(idx, 'studentId', e.target.value)}
                          placeholder={p.isSfit ? "e.g. SFIT2024-042" : "e.g. 2024-EX-102"}
                          className="w-full px-3 py-2 bg-[#FFFDF0] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] text-xs uppercase focus:outline-none"
                        />
                      </div>

                      {/* Email field with dynamic rules and feedback */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-arcade text-[11px] font-bold text-[#111827]">
                            {p.isSfit ? 'SFIT Email *' : 'Email (Any) *'}
                          </label>
                          {p.email && (
                            <span className={`text-[9px] font-pixel ${
                              p.isSfit 
                                ? (sfitEmailValid ? 'text-[#2E7D32]' : 'text-[#E5005A]')
                                : (generalEmailValid ? 'text-[#2E7D32]' : 'text-[#E5005A]')
                            }`}>
                              {p.isSfit 
                                ? (sfitEmailValid ? 'VALID SFIT ✓' : 'MUST BE SFIT')
                                : (generalEmailValid ? 'VALID EMAIL ✓' : 'INVALID FORMAT')}
                            </span>
                          )}
                        </div>
                        <input
                          type="email"
                          value={p.email}
                          onChange={(e) => updatePlayerField(idx, 'email', e.target.value)}
                          placeholder={p.isSfit ? "name@student.sfit.ac.in" : "e.g. name@gmail.com"}
                          className={`w-full px-3 py-2 bg-[#FFFDF0] border-2 ${
                            p.email && (p.isSfit ? !sfitEmailValid : !generalEmailValid)
                              ? 'border-[#E5005A]'
                              : 'border-[#111827]'
                          } shadow-[2px_2px_0_0_#111827] text-xs focus:outline-none`}
                        />
                        <span className="text-[10px] text-gray-500 font-body block mt-0.5">
                          {p.isSfit 
                            ? 'Must end with @student.sfit.ac.in'
                            : 'Any valid email address'}
                        </span>
                      </div>

                      {/* Mobile */}
                      <div>
                        <label className="block font-arcade text-[11px] font-bold text-[#111827] mb-1">
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          value={p.mobile}
                          onChange={(e) => updatePlayerField(idx, 'mobile', e.target.value)}
                          placeholder="e.g. 9820123456"
                          className="w-full px-3 py-2 bg-[#FFFDF0] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] text-xs focus:outline-none"
                        />
                      </div>

                      {/* Branch */}
                      <div>
                        <label className="block font-arcade text-[11px] font-bold text-[#111827] mb-1">
                          Branch / Department *
                        </label>
                        <select
                          value={p.branch}
                          onChange={(e) => updatePlayerField(idx, 'branch', e.target.value)}
                          className="w-full px-3 py-2 bg-[#FFFDF0] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] text-xs focus:outline-none"
                        >
                          {/* The config list already ends with OTHER; appending it again
                              put a duplicate entry in the dropdown. */}
                          {EVENT_CONFIG.participantConfig.branches.map((b) => (
                            <option key={b} value={b}>{b === 'OTHER' ? 'Other Branch' : b}</option>
                          ))}
                        </select>
                      </div>

                      {/* Year */}
                      <div>
                        <label className="block font-arcade text-[11px] font-bold text-[#111827] mb-1">
                          Academic Year *
                        </label>
                        <select
                          value={p.year}
                          onChange={(e) => updatePlayerField(idx, 'year', e.target.value)}
                          className="w-full px-3 py-2 bg-[#FFFDF0] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] text-xs focus:outline-none"
                        >
                          {EVENT_CONFIG.participantConfig.years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 sm:pt-6">
              <button
                onClick={prevStep}
                className="w-full sm:w-auto bg-[#FFFDF0] text-[#111827] font-arcade text-xs px-5 py-3 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827] flex items-center justify-center gap-2 hover:bg-[#F7E8B5]"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" /> BACK
              </button>
              <button
                onClick={nextStep}
                className="w-full sm:w-auto bg-[#111827] text-white font-arcade text-xs sm:text-sm px-6 py-3.5 border-2 border-[#111827] shadow-[3px_3px_0_0_#E5005A] flex items-center justify-center gap-2 hover:bg-[#E5005A] transition-colors"
              >
                <span>CONTINUE TO ID CARD UPLOAD</span> <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 3: COLLEGE ID CARD UPLOADS */}
      {/* ---------------------------------------------------- */}
      {currentStep === 3 && (
        <div className="bg-[#FFFDF0] border-3 sm:border-4 border-[#111827] shadow-[4px_4px_0_0_#111827] sm:shadow-[6px_6px_0_0_#111827] p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="border-b-2 border-[#111827] pb-3">
            <h2 className="font-arcade text-lg sm:text-xl text-[#111827] font-bold">
              STEP 3: COLLEGE IDENTITY CARD UPLOADS
            </h2>
            <p className="text-xs font-body text-[#111827]/80">
              Upload photo/scan of college identity cards to ensure verification at Room 318 entrance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {players.map((p, idx) => (
              <div
                key={idx}
                className="border-2 sm:border-3 border-[#111827] bg-[#F7E8B5] p-3.5 sm:p-4 shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="font-arcade text-xs font-bold text-[#111827] block truncate">
                      0{idx + 1}. {p.fullName || `Player ${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-body text-gray-700 block truncate">
                      {p.isSfit ? 'SFIT Student' : (p.college || 'Non-SFIT')}
                    </span>
                  </div>
                  {p.idCardUrl ? (
                    <span className="text-[#2E7D32] text-[10px] font-pixel flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> UPLOADED
                    </span>
                  ) : uploadingIds[idx] ? (
                    <span className="text-[#F9A825] text-[10px] font-pixel shrink-0">UPLOADING…</span>
                  ) : (
                    <span className="text-[#E5005A] text-[10px] font-pixel shrink-0">REQUIRED</span>
                  )}
                </div>

                {p.idCardUrl ? (
                  <div className="space-y-2">
                    <div className="w-full h-28 sm:h-32 border-2 border-[#111827] bg-white overflow-hidden flex items-center justify-center relative">
                      <img
                        src={p.idCardUrl}
                        alt={`ID card for ${p.fullName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <label className="block text-center text-[10px] font-arcade text-[#00AFC6] cursor-pointer hover:underline">
                      Replace ID Card
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleIdCardFileChange(idx, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : uploadingIds[idx] ? (
                  /* A real ID photo is a few MB and goes to Drive, so this can take
                     several seconds. Say so, or it reads as a frozen page. */
                  <div className="border-2 border-[#111827] bg-[#F7E8B5] p-4 text-center flex flex-col items-center justify-center min-h-[104px]">
                    <div className="w-5 h-5 border-2 border-[#111827] border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="font-arcade text-xs text-[#111827] font-bold">Uploading…</span>
                    <span className="text-[10px] text-gray-600 font-body mt-0.5">
                      Sending to secure storage — this can take a few seconds
                    </span>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[#111827] bg-[#FFFDF0] p-4 rounded-none text-center flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-colors">
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-[#E5005A] mb-1" />
                    <span className="font-arcade text-xs text-[#111827] font-bold">
                      Select or Drag ID Card
                    </span>
                    <span className="text-[10px] text-gray-500 font-body mt-0.5">
                      JPG, PNG, WEBP (Max 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleIdCardFileChange(idx, e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 sm:pt-4">
            <button
              onClick={prevStep}
              className="w-full sm:w-auto bg-[#FFFDF0] text-[#111827] font-arcade text-xs px-5 py-3 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827] flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" /> BACK
            </button>
            <button
              onClick={nextStep}
              className="w-full sm:w-auto bg-[#111827] text-white font-arcade text-xs sm:text-sm px-6 py-3.5 border-2 border-[#111827] shadow-[3px_3px_0_0_#E5005A] flex items-center justify-center gap-2 hover:bg-[#E5005A] transition-colors"
            >
              <span>REVIEW REGISTRATION</span> <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 4: COMPREHENSIVE REVIEW */}
      {/* ---------------------------------------------------- */}
      {currentStep === 4 && (
        <div className="bg-[#FFFDF0] border-3 sm:border-4 border-[#111827] shadow-[4px_4px_0_0_#111827] sm:shadow-[6px_6px_0_0_#111827] p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="border-b-2 border-[#111827] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-arcade text-lg sm:text-xl text-[#111827] font-bold">
                STEP 4: FINAL REVIEW & CONFIRMATION
              </h2>
              <p className="text-xs font-body text-[#111827]/80">
                Please double-check all information before submitting.
              </p>
            </div>
            <span className="bg-[#F4C430] border-2 border-[#111827] font-pixel text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 self-start sm:self-auto">
              STATUS: READY
            </span>
          </div>

          {/* Team Summary Card */}
          <div className="p-3.5 sm:p-4 bg-[#F7E8B5] border-2 sm:border-3 border-[#111827] shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <span className="text-[10px] font-pixel text-[#E5005A] uppercase">SQUAD NAME</span>
              <h3 className="font-pixel text-base sm:text-xl text-[#111827]">{teamName}</h3>
              <p className="text-xs font-body text-[#111827]/80 mt-0.5">
                Size: {teamSize} Players • Venue: Room No. 318 • Event: 16–17 Oct 2026
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs font-arcade text-[#00AFC6] border-2 border-[#111827] bg-[#FFFDF0] px-3 py-1.5 shadow-[2px_2px_0_0_#111827] hover:bg-white self-start sm:self-auto"
            >
              EDIT SQUAD
            </button>
          </div>

          {/* Mobile Player Cards Review (<= md) */}
          <div className="block md:hidden space-y-3">
            {players.map((p, idx) => (
              <div key={idx} className="p-3 bg-[#FFFDF0] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-[#111827]/20 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-pixel text-[10px] text-[#E5005A]">0{idx + 1}.</span>
                    <span className="font-bold text-[#111827]">{p.fullName}</span>
                    {idx === 0 && <span className="text-[#E5005A] text-[9px] font-pixel ml-1">[LEADER]</span>}
                  </div>
                  <span className={`px-2 py-0.5 font-pixel text-[9px] border border-[#111827] ${
                    p.isSfit ? 'bg-[#F4C430] text-[#111827]' : 'bg-[#00AFC6] text-white'
                  }`}>
                    {p.isSfit ? 'SFIT' : 'NON-SFIT'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-body text-gray-700">
                  <div>
                    <span className="text-gray-500 block text-[9px]">COLLEGE:</span>
                    <span className="font-arcade text-[10px] text-[#111827] truncate block">{p.isSfit ? 'SFIT' : (p.college || 'External College')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px]">STUDENT ID:</span>
                    <span className="font-mono text-[#111827]">{p.studentId}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block text-[9px]">EMAIL:</span>
                    <span className="font-mono text-[#00AFC6] break-all">{p.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px]">BRANCH / YR:</span>
                    <span>{p.branch} - {p.year}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px]">ID CARD:</span>
                    {p.idCardUrl ? (
                      <span className="text-[#2E7D32] font-pixel text-[9px]">✓ UPLOADED</span>
                    ) : (
                      <span className="text-[#E5005A] font-pixel text-[9px]">MISSING</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Players Review Table (> md) */}
          <div className="hidden md:block border-3 border-[#111827] overflow-x-auto shadow-[3px_3px_0_0_#111827]">
            <table className="w-full text-left text-xs font-body border-collapse">
              <thead>
                <tr className="bg-[#111827] text-white font-arcade">
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">College / Institute</th>
                  <th className="p-2.5">Student ID</th>
                  <th className="p-2.5">Email</th>
                  <th className="p-2.5">Branch/Year</th>
                  <th className="p-2.5">ID Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111827] bg-[#FFFDF0]">
                {players.map((p, idx) => (
                  <tr key={idx} className="hover:bg-[#F7E8B5]/50">
                    <td className="p-2.5 font-pixel text-[10px]">0{idx + 1}</td>
                    <td className="p-2.5 font-bold">
                      {p.fullName} {idx === 0 && <span className="text-[#E5005A] text-[10px] font-pixel ml-1">[LEADER]</span>}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 font-pixel text-[9px] border border-[#111827] ${
                        p.isSfit ? 'bg-[#F4C430] text-[#111827]' : 'bg-[#00AFC6] text-white'
                      }`}>
                        {p.isSfit ? 'SFIT' : 'NON-SFIT'}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="font-arcade text-[11px] text-[#111827]">
                        {p.isSfit ? 'SFIT' : (p.college || 'External College')}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono">{p.studentId}</td>
                    <td className="p-2.5 font-mono text-[#00AFC6]">{p.email}</td>
                    <td className="p-2.5">{p.branch} - {p.year}</td>
                    <td className="p-2.5">
                      {p.idCardUrl ? (
                        <span className="text-[#2E7D32] font-pixel text-[10px]">✓ UPLOADED</span>
                      ) : (
                        <span className="text-[#E5005A] font-pixel text-[10px]">MISSING</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fee Notice */}
          <div className="p-3.5 sm:p-4 bg-[#00AFC6] text-[#111827] border-2 sm:border-3 border-[#111827] shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-pixel text-[11px] sm:text-xs">REGISTRATION FEE</span>
              <p className="text-xs font-body">Covers tournament entry pass, task materials, and match participation.</p>
            </div>
            <div className="font-pixel text-xl font-bold">{money(payCfg.perHeadAmount * (players.length || 0))}</div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 sm:pt-4">
            <button
              onClick={prevStep}
              className="w-full sm:w-auto bg-[#FFFDF0] text-[#111827] font-arcade text-xs px-5 py-3 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827] flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" /> BACK
            </button>
            <button
              onClick={handleSubmitRegistration}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#E5005A] text-white font-arcade text-xs sm:text-sm px-6 sm:px-8 py-3.5 border-2 sm:border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] sm:shadow-[4px_4px_0_0_#111827] flex items-center justify-center gap-2 hover:bg-[#111827] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>CREATING REGISTRATION...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" /> <span>CONFIRM & GO TO PAYMENT</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 5: PAYMENT GATEWAY INTERFACE (CONTRACT BOUNDARY) */}
      {/* ---------------------------------------------------- */}
      {currentStep === 5 && createdRegistration && (
        <div className="bg-[#FFFDF0] border-3 sm:border-4 border-[#111827] shadow-[4px_4px_0_0_#111827] sm:shadow-[6px_6px_0_0_#111827] p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="border-b-2 border-[#111827] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="bg-[#4CAF50] text-white font-pixel text-[10px] sm:text-xs px-2 py-0.5 border border-[#111827] inline-block">
                REGISTRATION CREATED
              </span>
              <h2 className="font-pixel text-xl sm:text-2xl text-[#111827] mt-1">
                COMPLETE SQUAD PAYMENT
              </h2>
            </div>
            <div className="bg-[#F7E8B5] border-2 border-[#111827] p-2 text-left sm:text-right">
              <span className="text-[9px] sm:text-[10px] font-pixel text-gray-600 block">REGISTRATION ID</span>
              <span className="font-pixel text-xs sm:text-sm text-[#E5005A] font-bold break-all">
                {createdRegistration.registrationId}
              </span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 bg-[#111827] text-white border-2 sm:border-3 border-[#111827] shadow-[3px_3px_0_0_#00AFC6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-300 font-body">Squad: <strong className="text-white">{createdRegistration.teamName}</strong></p>
              <p className="text-xs text-gray-300 font-body">Leader: {createdRegistration.leaderName} ({createdRegistration.contactEmail})</p>
            </div>
            <div className="sm:text-right flex items-center justify-between sm:block">
              <span className="text-[10px] font-pixel text-[#00AFC6] block">TOTAL AMOUNT</span>
              <div className="font-pixel text-xl sm:text-2xl text-[#F4C430]">₹500</div>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-arcade text-xs font-bold uppercase tracking-wider text-[#111827]">
              Choose Payment Method
            </h3>

            <div className={`grid grid-cols-1 gap-4 ${mockEnabled ? 'sm:grid-cols-2' : ''}`}>
              {/* Option 1: Mock Dev Instant Pay - development only */}
              {mockEnabled && <button
                type="button"
                onClick={() => setPaymentMethod('MOCK')}
                className={`p-3.5 sm:p-4 border-2 sm:border-3 border-[#111827] text-left transition-all ${
                  paymentMethod === 'MOCK'
                    ? 'bg-[#00AFC6] text-white shadow-[3px_3px_0_0_#111827] sm:shadow-[4px_4px_0_0_#111827]'
                    : 'bg-[#FFFDF0] text-[#111827] hover:bg-[#F7E8B5]'
                }`}
              >
                <div className="font-pixel text-xs mb-1">MOCK INSTANT PAY</div>
                <div className="text-xs font-body opacity-90">
                  Development Mode: Instantly marks payment as PAID, issues official QR pass and receipt for testing.
                </div>
              </button>}

              {/* Option 2: Manual UPI / QR */}
              <button
                type="button"
                onClick={() => setPaymentMethod('MANUAL_UPI')}
                className={`p-3.5 sm:p-4 border-2 sm:border-3 border-[#111827] text-left transition-all ${
                  paymentMethod === 'MANUAL_UPI'
                    ? 'bg-[#E5005A] text-white shadow-[3px_3px_0_0_#111827] sm:shadow-[4px_4px_0_0_#111827]'
                    : 'bg-[#FFFDF0] text-[#111827] hover:bg-[#F7E8B5]'
                }`}
              >
                <div className="font-pixel text-xs mb-1">UPI QR & UTR SUBMIT</div>
                <div className="text-xs font-body opacity-90">
                  Scan the UPI QR, pay your share, and enter your 12-digit UTR reference plus the amount you paid.
                </div>
              </button>
            </div>
          </div>

          {/* Method 1: Mock Payment Flow */}
          {mockEnabled && paymentMethod === 'MOCK' && (
            <div className="p-6 bg-[#F7E8B5] border-3 border-[#111827] space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E5005A] shrink-0" />
                <h4 className="font-arcade text-xs sm:text-sm font-bold text-[#111827]">
                  TEST IN DEVELOPMENT PAYMENT MODE
                </h4>
              </div>
              <p className="text-xs font-body text-[#111827]/90 leading-relaxed">
                For testing and instant demonstration, you can simulate a successful payment without entering bank credentials. Clicking the button below will transition this registration to <strong className="font-arcade text-[#2E7D32]">CONFIRMED</strong>, generate the official QR ticket, generate the payment receipt, and dispatch the confirmation email.
              </p>

              <button
                onClick={handleMockPayment}
                disabled={paymentLoading}
                className="w-full bg-[#4CAF50] text-white font-arcade text-xs sm:text-sm py-3.5 sm:py-4 border-2 sm:border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] sm:shadow-[4px_4px_0_0_#111827] hover:bg-[#111827] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <span>SIMULATING PAYMENT SETTLEMENT...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> SIMULATE INSTANT SUCCESSFUL PAYMENT (DEV)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Method 2: Manual UPI Transfer & UTR Submission */}
          {paymentMethod === 'MANUAL_UPI' && (
            <div className="p-4 sm:p-6 bg-[#FFFDF0] border-2 sm:border-3 border-[#111827] space-y-4 sm:space-y-5">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border-b-2 border-[#111827] pb-4 text-center sm:text-left">
                <div className="w-32 h-32 sm:w-36 sm:h-36 bg-white border-2 sm:border-3 border-[#111827] p-2 flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#111827] mx-auto sm:mx-0">
                  {/* Real, scannable QR built from the exact URI a UPI app reads */}
                  <div className="w-full bg-white p-2 border-2 border-[#111827] flex flex-col items-center justify-center">
                    {qrImage ? (
                      <img
                        src={qrImage}
                        alt={`UPI QR to pay ${payOrder?.vpa || ''}`}
                        className="w-36 h-36 sm:w-44 sm:h-44"
                      />
                    ) : (
                      <div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                        <span className="text-[10px] font-pixel text-[#111827]/50 text-center px-2">
                          PREPARING QR…
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs font-body">
                  <h4 className="font-pixel text-xs text-[#E5005A]">
                    PAY {money(payCfg.perHeadAmount * (players.length || 0))} FOR YOUR SQUAD
                  </h4>
                  <p className="text-[#111827]/70 text-[11px]">
                    Pay your own share or the whole squad amount — whatever you transfer,
                    enter that figure below.
                  </p>

                  {/* On a phone the QR is useless (you cannot scan your own screen),
                      so tapping straight into a UPI app is the primary route. */}
                  {upiUri && (
                    <a href={upiUri}
                      className="block text-center font-arcade text-xs py-3.5 border-2 border-[#111827] bg-[#2E7D32] text-white shadow-[3px_3px_0_0_#111827] hover:brightness-110">
                      PAY {money(payNow)} WITH ANY UPI APP
                    </a>
                  )}
                  {upiApps.length > 0 && (
                    <>
                      <p className="text-[10px] text-center text-[#111827]/50 uppercase tracking-wide pt-1">
                        or open a specific app
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {upiApps.map(app => (
                          <a key={app.label} href={app.href}
                            className="text-center font-bold text-[10px] py-2 border-2 border-[#111827] bg-[#F7E8B5] hover:bg-[#E5005A] hover:text-white transition-colors">
                            {app.label}
                          </a>
                        ))}
                      </div>
                    </>
                  )}

                {/* Some wallets refuse intents they did not originate - a student hitting
                    one should know to try another route rather than give up. */}
                <p className="text-[10px] text-[#111827]/60 leading-snug">
                  If one app refuses the payment, pick a different one, scan the QR from
                  another phone, or copy the UPI ID below and pay manually. All three
                  reach the same account.
                </p>
                  {/* Always show the raw UPI ID: it works even if every deep link and
                      the QR fail, and it lets the payer confirm where the money goes. */}
                  <div className="pt-1">
                    <p className="text-[10px] uppercase tracking-wide font-bold text-[#111827]/50">
                      Or pay this UPI ID manually
                    </p>
                    <button
                      type="button"
                      onClick={copyVpa}
                      title="Tap to copy"
                      className="mt-1 w-full font-mono text-xs bg-[#F7E8B5] px-2 py-2 border-2 border-[#111827] break-all text-left hover:bg-[#F4C430]"
                    >
                      {payOrder?.vpa || 'loading…'}
                      {copiedVpa && <span className="ml-2 text-[#2E7D32] font-bold">copied</span>}
                    </button>
                  </div>

                  <p className="text-[#111827]/80 text-[11px]">
                    Reference / note: <strong className="font-mono break-all">{createdRegistration.registrationId}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-arcade text-xs font-bold text-[#111827] mb-1">
                    12-Digit UPI Reference (UTR) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    pattern="[0-9]*"
                    value={utrNumber}
                    onChange={(e) => { setUtrNumber(e.target.value.replace(/[^0-9A-Za-z]/g, '')); setErrorMsg(null); }}
                    placeholder="426189012345"
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[#F7E8B5] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] font-mono text-base tracking-wider focus:outline-none"
                  />
                  <p className="text-[10px] text-[#111827]/60 mt-1">
                    In GPay tap the payment → <strong>UPI transaction ID</strong>. In PhonePe/Paytm
                    it is on the receipt as <strong>UTR</strong>. Long-press to copy, then paste here.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-arcade text-xs font-bold text-[#111827] mb-1">
                      Amount You Paid (₹) *
                    </label>
                    <input
                      type="number" min="1" step="1"
                      value={paidAmount}
                      onChange={(e) => { setPaidAmount(e.target.value); setErrorMsg(null); }}
                      placeholder="e.g. 100"
                      className="w-full px-4 py-3 bg-[#F7E8B5] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-arcade text-xs font-bold text-[#111827] mb-1">
                      Who Paid? (Optional)
                    </label>
                    <input
                      type="text"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="Player name"
                      className="w-full px-4 py-3 bg-[#FFFDF0] border-2 border-[#111827] text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Running total, so the squad can see what is still outstanding. */}
                {paySummary && (
                  <div className={`p-3 border-2 border-[#111827] text-sm ${
                    paySummary.fullyPaid ? 'bg-[#2E7D32]/10' : 'bg-[#F9A825]/15'
                  }`}>
                    <p className="font-bold">
                      ₹{paySummary.amountPaid} received of ₹{paySummary.amountExpected}
                    </p>
                    {paySummary.fullyPaid ? (
                      <p className="text-[#2E7D32] text-xs mt-0.5">
                        Squad fully paid. Sent to the organisers for verification.
                      </p>
                    ) : (
                      <p className="text-[#C62828] text-xs mt-0.5">
                        Still ₹{paySummary.remaining} to go — the next member can submit their UTR below.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-arcade text-xs font-bold text-[#111827] mb-1">
                    Payment Proof / Screenshot (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleProofUpload}
                    disabled={proofUploading}
                    className="w-full px-3 py-2 bg-[#FFFDF0] border-2 border-[#111827] text-xs file:mr-3 file:px-3 file:py-1 file:border-2 file:border-[#111827] file:bg-[#F7E8B5] file:font-bold file:text-xs disabled:opacity-50"
                  />
                  {proofUploading && (
                    <p className="text-xs text-[#111827]/60 mt-1">Uploading…</p>
                  )}
                  {!proofUploading && utrProofUrl && (
                    <p className="text-xs text-[#2E7D32] mt-1">
                      ✓ {proofName || 'Screenshot'} attached
                    </p>
                  )}
                </div>

                <button
                  onClick={handleManualUpiSubmit}
                  disabled={paymentLoading}
                  className="w-full bg-[#E5005A] text-white font-arcade text-xs sm:text-sm py-3.5 border-2 sm:border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] hover:bg-[#111827] transition-all disabled:opacity-50"
                >
                  {paymentLoading ? 'SUBMITTING EVIDENCE...' : paySummary && !paySummary.fullyPaid ? 'SUBMIT NEXT PAYMENT' : 'SUBMIT UTR FOR ADMIN VERIFICATION'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;
