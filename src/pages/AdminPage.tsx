import React, { useState, useEffect } from 'react';
import { 
  adminLogin, 
  fetchAdminDashboard, 
  fetchAdminRegistrations, 
  fetchAdminStudents, 
  fetchAdminPayments, 
  verifyAdminPayment, 
  rejectAdminPayment, 
  fetchAuditLogs, 
  fetchEmailLogs 
} from '../services/api.ts';
import { 
  Lock, 
  ShieldCheck, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Download, 
  Eye, 
  Check, 
  X, 
  Mail, 
  FileSpreadsheet, 
  LogOut, 
  Filter,
  RefreshCw
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('deception_admin_token'));
  const [adminUser, setAdminUser] = useState<any>(() => {
    const saved = localStorage.getItem('deception_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login form state
  const [emailInput, setEmailInput] = useState('admin@adg.org');
  const [passwordInput, setPasswordInput] = useState('Deception@2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Admin Sub-tab
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'verification' | 'students' | 'audit' | 'emails'>('overview');

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Registration Filters
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState('');
  const [regSizeFilter, setRegSizeFilter] = useState('');

  // Selected Registration Modal
  const [selectedReg, setSelectedReg] = useState<any | null>(null);

  // Rejection modal
  const [rejectModalPayment, setRejectModalPayment] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (token) {
      loadAllAdminData();
    }
  }, [token, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await adminLogin({ email: emailInput, password: passwordInput });
      setToken(res.token);
      setAdminUser(res.admin);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('deception_admin_token');
    localStorage.removeItem('deception_admin_user');
    setToken(null);
    setAdminUser(null);
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const stats = await fetchAdminDashboard();
        setDashboardData(stats);
      } else if (activeTab === 'registrations') {
        const regs = await fetchAdminRegistrations({
          search: regSearch,
          status: regStatusFilter,
          teamSize: regSizeFilter
        });
        setRegistrations(regs);
      } else if (activeTab === 'verification') {
        const pList = await fetchAdminPayments();
        setPayments(pList);
      } else if (activeTab === 'students') {
        const sList = await fetchAdminStudents();
        setStudents(sList);
      } else if (activeTab === 'audit') {
        const logs = await fetchAuditLogs();
        setAuditLogs(logs);
      } else if (activeTab === 'emails') {
        const eList = await fetchEmailLogs();
        setEmailLogs(eList);
      }
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      await verifyAdminPayment(paymentId);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectModalPayment) return;
    try {
      await rejectAdminPayment(rejectModalPayment.paymentId, rejectReason || 'Transaction could not be verified on bank statement');
      setRejectModalPayment(null);
      setRejectReason('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  // ----------------------------------------------------
  // LOGIN SCREEN
  // ----------------------------------------------------
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[8px_8px_0_0_#111827] p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#E5005A] border-3 border-[#111827] mx-auto flex items-center justify-center text-white shadow-[2px_2px_0_0_#111827]">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-pixel text-2xl text-[#111827]">ADMIN LOGIN</h1>
            <p className="text-xs font-arcade text-gray-600">DECEPTION 2026 ORGANIZER SUITE</p>
          </div>

          {loginError && (
            <div className="p-3 bg-[#E5005A] text-white text-xs font-arcade border-2 border-[#111827]">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-body">
            <div>
              <label className="block font-arcade text-[11px] font-bold text-[#111827] mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#F7E8B5] border-2 border-[#111827] font-mono shadow-[2px_2px_0_0_#111827] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-arcade text-[11px] font-bold text-[#111827] mb-1">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#F7E8B5] border-2 border-[#111827] font-mono shadow-[2px_2px_0_0_#111827] focus:outline-none"
              />
            </div>

            <div className="p-3 bg-[#F7E8B5] border border-[#111827] text-[11px] font-mono space-y-1">
              <span className="text-[#E5005A] font-bold font-pixel text-[9px] block">PRELOADED SEED ACCOUNT:</span>
              <div>Email: admin@adg.org</div>
              <div>Password: Deception@2026</div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#111827] text-white font-arcade text-xs py-3 border-2 border-[#111827] shadow-[3px_3px_0_0_#E5005A] hover:bg-[#E5005A] transition-colors disabled:opacity-50"
            >
              {loginLoading ? 'AUTHENTICATING...' : 'ACCESS CONTROL PORTAL'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LOGGED-IN ADMIN DASHBOARD
  // ----------------------------------------------------
  const pendingPayments = payments.filter((p) => p.status === 'PENDING_VERIFICATION');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Admin Header Bar */}
      <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[6px_6px_0_0_#111827] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#E5005A] text-white font-pixel text-[10px] px-2 py-0.5 border border-[#111827]">
              ORGANIZER ACCESS
            </span>
            <span className="text-xs font-mono text-gray-600">
              Logged in as {adminUser?.name || 'Administrator'} ({adminUser?.email})
            </span>
          </div>
          <h1 className="font-pixel text-2xl sm:text-3xl text-[#111827] mt-1 tracking-wider">
            DECEPTION ADMIN CONTROL
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Individual Excel Reports */}
          <a
            href="/api/admin/export/all"
            download="DECEPTION_2026_MASTER_REGISTRATIONS.xlsx"
            title="Download Master All-in-One Workbook with Overview, Teams, Students & ID Cards, and Payments & Receipts"
            className="bg-[#4CAF50] text-white font-arcade text-xs px-3 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-[#111827] transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> MASTER EXCEL
          </a>

          <a
            href="/api/admin/export/teams"
            download="DECEPTION_2026_TEAMS_LIST.xlsx"
            title="Download Teams Roster Excel with Squad sizes, Leader contacts, Tickets & Invoices"
            className="bg-[#00AFC6] text-[#111827] font-arcade text-xs px-3 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-white transition-all flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" /> TEAMS LIST (.XLSX)
          </a>

          <a
            href="/api/admin/export/students"
            download="DECEPTION_2026_STUDENTS_LIST.xlsx"
            title="Download Students & ID Cards Excel with SFIT & Non-SFIT colleges, ID Card Links, and Tickets"
            className="bg-[#F4C430] text-[#111827] font-arcade text-xs px-3 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-white transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> STUDENTS &amp; ID CARDS (.XLSX)
          </a>

          <a
            href="/api/admin/export/payments"
            download="DECEPTION_2026_PAYMENTS_LIST.xlsx"
            title="Download Payments Roster Excel with UTR numbers, Invoices, Receipts, and verification timestamps"
            className="bg-[#E5005A] text-white font-arcade text-xs px-3 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-[#111827] transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> PAYMENTS &amp; RECEIPTS (.XLSX)
          </a>

          <button
            onClick={handleLogout}
            className="bg-[#111827] text-white font-arcade text-xs px-3 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-[#E5005A] transition-all flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> LOGOUT
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b-3 border-[#111827] pb-2 font-arcade text-xs">
        {[
          { id: 'overview', label: 'Dashboard Overview' },
          { id: 'registrations', label: `Registrations (${dashboardData?.totalRegistrations ?? '...'})` },
          { id: 'verification', label: `Payment Desk (${pendingPayments.length} Pending)` },
          { id: 'students', label: `Participants (${students.length})` },
          { id: 'audit', label: 'Audit Trail' },
          { id: 'emails', label: 'Email Dispatches' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 border-2 border-[#111827] transition-all ${
              activeTab === tab.id
                ? 'bg-[#111827] text-white shadow-[3px_3px_0_0_#E5005A]'
                : 'bg-[#FFFDF0] text-[#111827] hover:bg-[#F7E8B5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. OVERVIEW TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FFFDF0] border-3 border-[#111827] p-5 shadow-[4px_4px_0_0_#111827]">
              <span className="text-[10px] font-pixel text-gray-500 block">TOTAL REGISTRATIONS</span>
              <div className="font-pixel text-3xl text-[#111827] mt-1">
                {dashboardData?.totalRegistrations ?? 0}
              </div>
              <span className="text-xs font-arcade text-[#00AFC6] mt-1 block">
                {dashboardData?.confirmedRegistrations ?? 0} Confirmed Passes
              </span>
            </div>

            <div className="bg-[#FFFDF0] border-3 border-[#111827] p-5 shadow-[4px_4px_0_0_#111827]">
              <span className="text-[10px] font-pixel text-gray-500 block">TOTAL SQUAD TEAMS</span>
              <div className="font-pixel text-3xl text-[#E5005A] mt-1">
                {dashboardData?.totalTeams ?? 0}
              </div>
              <span className="text-xs font-arcade text-gray-600 mt-1 block">
                Strict 5 or 6 players
              </span>
            </div>

            <div className="bg-[#FFFDF0] border-3 border-[#111827] p-5 shadow-[4px_4px_0_0_#111827]">
              <span className="text-[10px] font-pixel text-gray-500 block">VERIFIED STUDENTS</span>
              <div className="font-pixel text-3xl text-[#4CAF50] mt-1">
                {dashboardData?.totalStudents ?? 0}
              </div>
              <span className="text-xs font-arcade text-gray-600 mt-1 block">
                @student.sfit.ac.in
              </span>
            </div>

            <div className="bg-[#FFFDF0] border-3 border-[#111827] p-5 shadow-[4px_4px_0_0_#111827]">
              <span className="text-[10px] font-pixel text-gray-500 block">TOTAL REVENUE</span>
              <div className="font-pixel text-3xl text-[#F4C430] mt-1">
                ₹{dashboardData?.totalRevenue ?? 0}
              </div>
              <span className="text-xs font-arcade text-[#111827] mt-1 block">
                {dashboardData?.pendingVerification ?? 0} Pending Verification
              </span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-[#F7E8B5] border-3 border-[#111827] p-6 shadow-[4px_4px_0_0_#111827] space-y-3">
            <h3 className="font-arcade text-sm font-bold text-[#111827]">
              ORGANIZER OPERATIONAL SUMMARY
            </h3>
            <p className="text-xs font-body text-[#111827]/90 leading-relaxed">
              DECEPTION matches take place on <strong>16 & 17 October 2026</strong> in <strong>Room No. 318</strong>. All squads have 5 or 6 participants. When payments are confirmed, ticket QR codes are automatically generated for seamless check-in at the entrance.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setActiveTab('verification')}
                className="bg-[#111827] text-white font-arcade text-xs px-4 py-2 border-2 border-[#111827]"
              >
                OPEN VERIFICATION QUEUE &gt;
              </button>
              <button
                onClick={() => setActiveTab('registrations')}
                className="bg-[#00AFC6] text-[#111827] font-arcade text-xs px-4 py-2 border-2 border-[#111827]"
              >
                VIEW SQUAD ROSTER &gt;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. REGISTRATIONS TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#FFFDF0] border-3 border-[#111827] p-4 shadow-[3px_3px_0_0_#111827] flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder="Search by code, team name, or email..."
                className="w-full px-3 py-2 bg-[#F7E8B5] border-2 border-[#111827] text-xs font-body"
              />
            </div>

            <select
              value={regStatusFilter}
              onChange={(e) => setRegStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#F7E8B5] border-2 border-[#111827] text-xs font-arcade"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <select
              value={regSizeFilter}
              onChange={(e) => setRegSizeFilter(e.target.value)}
              className="px-3 py-2 bg-[#F7E8B5] border-2 border-[#111827] text-xs font-arcade"
            >
              <option value="">All Squad Sizes</option>
              <option value="5">5 Players</option>
              <option value="6">6 Players</option>
            </select>

            <button
              onClick={loadAllAdminData}
              className="px-4 py-2 bg-[#111827] text-white font-arcade text-xs border-2 border-[#111827] hover:bg-gray-800"
            >
              REFRESH
            </button>

            <a
              href="/api/admin/export/teams"
              download="DECEPTION_2026_TEAMS_LIST.xlsx"
              className="px-3.5 py-2 bg-[#00AFC6] text-[#111827] font-arcade text-xs border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-white flex items-center gap-1.5 shrink-0"
            >
              <Users className="w-3.5 h-3.5" /> EXPORT TEAMS (.XLSX)
            </a>
          </div>

          {/* Table */}
          <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] overflow-x-auto">
            <table className="w-full text-left text-xs font-body border-collapse">
              <thead>
                <tr className="bg-[#111827] text-white font-arcade">
                  <th className="p-3">Code</th>
                  <th className="p-3">Squad Name</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Leader</th>
                  <th className="p-3">Registration Status</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111827]">
                {registrations.map((reg) => (
                  <tr key={reg.registrationId} className="hover:bg-[#F7E8B5]/50">
                    <td className="p-3 font-mono font-bold text-[#E5005A]">
                      {reg.registrationId}
                    </td>
                    <td className="p-3 font-bold">{reg.teamName}</td>
                    <td className="p-3">{reg.teamSize || reg.players?.length || 5}P</td>
                    <td className="p-3">
                      <div>{reg.leaderName}</div>
                      <div className="text-gray-500 text-[10px] font-mono">{reg.contactEmail}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 border border-[#111827] font-pixel text-[9px] ${
                        reg.status === 'CONFIRMED' ? 'bg-[#4CAF50] text-white' : 'bg-[#F4C430] text-[#111827]'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 border border-[#111827] font-pixel text-[9px] ${
                        reg.payment?.status === 'PAID'
                          ? 'bg-[#4CAF50] text-white'
                          : reg.payment?.status === 'PENDING_VERIFICATION'
                          ? 'bg-[#00AFC6] text-white'
                          : 'bg-[#E5005A] text-white'
                      }`}>
                        {reg.payment?.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 text-[11px]">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedReg(reg)}
                        className="px-2.5 py-1 bg-[#00AFC6] text-[#111827] border-2 border-[#111827] font-arcade text-[10px] hover:bg-white"
                      >
                        VIEW DETAILS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. PAYMENT VERIFICATION DESK */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF0] border-3 border-[#111827] p-5 shadow-[4px_4px_0_0_#111827] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-arcade text-base font-bold text-[#111827]">
                MANUAL UPI VERIFICATION QUEUE
              </h3>
              <p className="text-xs font-body text-gray-600">
                Review bank UTR numbers and screenshots. Approving a payment marks the squad CONFIRMED and generates their ticket QR pass.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/admin/export/payments"
                download="DECEPTION_2026_PAYMENTS_LIST.xlsx"
                className="bg-[#E5005A] text-white font-arcade text-xs px-3.5 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-[#111827] transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" /> EXPORT PAYMENTS (.XLSX)
              </a>
              <span className="bg-[#00AFC6] text-white font-pixel text-xs px-3 py-1 border-2 border-[#111827]">
                {pendingPayments.length} PENDING
              </span>
            </div>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="bg-[#F7E8B5] border-3 border-[#111827] p-8 text-center font-arcade text-sm text-[#111827]">
              ✓ No pending UPI payments requiring verification.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingPayments.map((p) => (
                <div
                  key={p.paymentId}
                  className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] p-5 space-y-3 text-xs font-body"
                >
                  <div className="flex items-center justify-between border-b border-[#111827] pb-2">
                    <span className="font-mono font-bold text-[#E5005A] text-sm">
                      {p.registrationCode || p.registrationId}
                    </span>
                    <span className="font-pixel text-xs bg-[#F4C430] px-2 py-0.5 border border-[#111827]">
                      ₹{p.amount}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div><strong>Squad:</strong> {p.teamName || 'Squad Team'}</div>
                    <div><strong>Submitted UTR:</strong> <span className="font-mono bg-[#F7E8B5] px-1 border border-[#111827] font-bold">{p.transactionReference}</span></div>
                    <div><strong>Provider:</strong> {p.provider}</div>
                    <div><strong>Submitted At:</strong> {new Date(p.createdAt).toLocaleString()}</div>
                  </div>

                  {p.evidenceUrl && (
                    <div className="pt-1">
                      <span className="text-[10px] font-pixel text-gray-500 block mb-1">PAYMENT SCREENSHOT:</span>
                      <a href={p.evidenceUrl} target="_blank" rel="noreferrer" className="block w-full h-32 border-2 border-[#111827] overflow-hidden bg-white hover:opacity-90">
                        <img src={p.evidenceUrl} alt="UTR proof" className="w-full h-full object-contain" />
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleVerifyPayment(p.paymentId)}
                      className="flex-1 bg-[#4CAF50] text-white font-arcade text-xs py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-[#111827] transition-all flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" /> VERIFY PAYMENT
                    </button>
                    <button
                      onClick={() => setRejectModalPayment(p)}
                      className="px-3 bg-[#E5005A] text-white font-arcade text-xs py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-[#111827] transition-all flex items-center gap-1"
                    >
                      <X className="w-4 h-4" /> REJECT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. STUDENTS ROSTER TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF0] border-3 border-[#111827] p-4 shadow-[3px_3px_0_0_#111827] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-arcade text-sm font-bold text-[#111827]">
                PARTICIPANTS &amp; STUDENTS ROSTER ({students.length} REGISTERED)
              </h3>
              <p className="text-xs font-body text-gray-600">
                Complete student records across SFIT and external colleges with uploaded ID cards.
              </p>
            </div>
            <a
              href="/api/admin/export/students"
              download="DECEPTION_2026_STUDENTS_LIST.xlsx"
              className="bg-[#F4C430] text-[#111827] font-arcade text-xs px-4 py-2 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] hover:bg-white transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" /> EXPORT STUDENTS &amp; ID CARDS (.XLSX)
            </a>
          </div>

          <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] overflow-x-auto">
            <table className="w-full text-left text-xs font-body border-collapse">
              <thead>
                <tr className="bg-[#111827] text-white font-arcade">
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Institute / College</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Branch/Year</th>
                  <th className="p-3">College ID Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111827]">
                {students.map((st) => {
                  const isSfit = st.collegeType === 'SFIT' || st.isSfit !== false || st.college === 'SFIT';
                  return (
                    <tr key={st.studentId || st._id} className="hover:bg-[#F7E8B5]/50">
                      <td className="p-3 font-mono font-bold text-[#111827]">{st.studentId}</td>
                      <td className="p-3 font-bold">
                        {st.fullName}
                        {st.participantType === 'LEADER' && (
                          <span className="ml-2 bg-[#E5005A] text-white text-[9px] font-pixel px-1.5 py-0.5 border border-[#111827]">
                            LEADER
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {isSfit ? (
                          <span className="bg-[#F4C430] text-[#111827] px-2 py-0.5 font-arcade text-[10px] border border-[#111827] font-bold">
                            SFIT
                          </span>
                        ) : (
                          <span className="bg-[#00AFC6] text-[#111827] px-2 py-0.5 font-arcade text-[10px] border border-[#111827] font-bold" title={st.college}>
                            NON-SFIT: {st.college || 'Other'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[#00AFC6]">{st.email}</td>
                      <td className="p-3 font-mono">{st.mobile}</td>
                      <td className="p-3">{st.branch} • {st.year}</td>
                      <td className="p-3">
                        {st.idCardUrl ? (
                          <a
                            href={st.idCardUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 bg-[#2E7D32] text-white font-pixel text-[10px] px-2 py-1 border border-[#111827] hover:bg-[#111827]"
                          >
                            <Eye className="w-3 h-3" /> VIEW ID
                          </a>
                        ) : (
                          <span className="text-[#E5005A] font-pixel text-[10px]">PENDING</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. AUDIT TRAIL TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF0] border-3 border-[#111827] p-4 shadow-[3px_3px_0_0_#111827]">
            <h3 className="font-arcade text-sm font-bold text-[#111827]">
              SYSTEM AUDIT TRAIL
            </h3>
            <p className="text-xs font-body text-gray-600">
              Immutable activity log recording registrations, payments, and admin actions.
            </p>
          </div>

          <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] divide-y divide-[#111827]">
            {auditLogs.map((log, idx) => (
              <div key={idx} className="p-4 flex items-start gap-4 hover:bg-[#F7E8B5]/40 text-xs font-body">
                <span className="font-pixel text-[10px] bg-[#111827] text-white px-2 py-0.5 shrink-0">
                  {log.action}
                </span>
                <div className="flex-1 space-y-0.5">
                  <div className="font-bold text-[#111827]">
                    Target: {log.targetType} ({log.targetId})
                  </div>
                  <div className="text-gray-600 font-mono text-[11px]">
                    {JSON.stringify(log.details)}
                  </div>
                </div>
                <div className="text-gray-500 font-mono text-[10px] shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. EMAIL DISPATCHES TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="bg-[#FFFDF0] border-3 border-[#111827] p-4 shadow-[3px_3px_0_0_#111827]">
            <h3 className="font-arcade text-sm font-bold text-[#111827]">
              IN-APP EMAIL DISPATCH REPOSITORY
            </h3>
            <p className="text-xs font-body text-gray-600">
              View all confirmation notices and QR pass tickets dispatched to team leaders.
            </p>
          </div>

          <div className="space-y-3">
            {emailLogs.map((eLog) => (
              <div key={eLog.id} className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] p-4 space-y-2 text-xs font-body">
                <div className="flex items-center justify-between border-b border-[#111827] pb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#E5005A]" />
                    <span className="font-bold font-arcade">{eLog.subject}</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-500">
                    {new Date(eLog.sentAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-gray-600 font-mono text-[11px]">
                  <strong>To:</strong> {eLog.to} • <strong>Status:</strong> {eLog.status}
                </div>
                <div className="p-3 bg-[#F7E8B5]/50 border border-[#111827] font-mono text-[11px] whitespace-pre-wrap">
                  {eLog.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* REGISTRATION DETAIL MODAL */}
      {/* ---------------------------------------------------- */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-[#111827]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[8px_8px_0_0_#000] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 text-xs font-body">
            <div className="flex items-center justify-between border-b-2 border-[#111827] pb-3">
              <div>
                <span className="font-pixel text-[10px] text-[#E5005A]">
                  REGISTRATION INSPECTOR
                </span>
                <h3 className="font-pixel text-xl text-[#111827]">
                  {selectedReg.registrationId} • {selectedReg.teamName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="p-1 border-2 border-[#111827] bg-[#F7E8B5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F7E8B5] p-4 border-2 border-[#111827]">
              <div>
                <div><strong>Leader:</strong> {selectedReg.leaderName}</div>
                <div><strong>Email:</strong> {selectedReg.contactEmail}</div>
                <div><strong>Mobile:</strong> {selectedReg.contactPhone}</div>
              </div>
              <div>
                <div><strong>Registration Status:</strong> {selectedReg.status}</div>
                <div><strong>Payment Status:</strong> {selectedReg.payment?.status || 'PENDING'}</div>
                <div><strong>Team Size:</strong> {selectedReg.players?.length || 5} Players</div>
              </div>
            </div>

            {/* Players Table */}
            <div>
              <h4 className="font-arcade text-xs font-bold text-[#111827] mb-2">
                SQUAD ROSTER & ID VERIFICATION
              </h4>
              <div className="border-2 border-[#111827] overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#111827] text-white font-arcade text-[10px]">
                      <th className="p-2">#</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Student ID</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Branch/Year</th>
                      <th className="p-2">ID Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111827]">
                    {selectedReg.players?.map((p: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 font-mono">0{idx + 1}</td>
                        <td className="p-2 font-bold">{p.fullName}</td>
                        <td className="p-2 font-mono">{p.studentId}</td>
                        <td className="p-2 font-mono">{p.email}</td>
                        <td className="p-2">{p.branch} - {p.year}</td>
                        <td className="p-2">
                          {p.idCardUrl ? (
                            <a href={p.idCardUrl} target="_blank" rel="noreferrer" className="text-[#00AFC6] underline font-arcade text-[10px]">
                              VIEW CARD
                            </a>
                          ) : (
                            <span className="text-[#E5005A]">NONE</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReg(null)}
                className="bg-[#111827] text-white font-arcade text-xs px-5 py-2 border-2 border-[#111827]"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* REJECT PAYMENT MODAL */}
      {/* ---------------------------------------------------- */}
      {rejectModalPayment && (
        <div className="fixed inset-0 z-50 bg-[#111827]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[8px_8px_0_0_#000] max-w-md w-full p-6 space-y-4 text-xs font-body">
            <h3 className="font-arcade text-base font-bold text-[#E5005A]">
              REJECT PAYMENT ({rejectModalPayment.registrationCode || rejectModalPayment.paymentId})
            </h3>
            <p className="text-gray-700">
              Provide a reason for rejection. The squad leader will be alerted to re-submit or correct payment details.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. UTR number not found in bank statement, partial amount transferred..."
              rows={3}
              className="w-full p-3 bg-[#F7E8B5] border-2 border-[#111827] font-body text-xs focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalPayment(null)}
                className="px-4 py-2 border-2 border-[#111827] font-arcade text-xs"
              >
                CANCEL
              </button>
              <button
                onClick={handleRejectPayment}
                className="px-4 py-2 bg-[#E5005A] text-white font-arcade text-xs border-2 border-[#111827]"
              >
                CONFIRM REJECTION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
