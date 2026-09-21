# DECEPTION — EVENT REGISTRATION SYSTEM (PART 1)
**An Among Us / Social Deduction Themed College Tech Game Registration Platform**  
**Organized by:** AI DEVELOPERS GROUP (ADG) x MosaIC  
**Dates:** 16–17 October 2026 | **Venue:** Room No. 318, St. Francis Institute of Technology (SFIT)  

---

## 1. PROJECT OVERVIEW

DECEPTION is a high-stakes, real-world mystery game where teams of engineering students complete physical and technical tasks in Room 318 while watching out for secret imposters.

This repository contains the complete **PART 1 (Main Application & Registration Core)**. It delivers:
- Visual UI modeled directly after the official **DECEPTION poster** (cream graph paper texture, cyan/magenta/yellow/green game blocks, pixel/arcade typography, Among Us table meeting motif).
- Strict multi-player team registration (strictly 5 or 6 participants).
- Official college email domain enforcement (`@student.sfit.ac.in`).
- Student deduplication engine (reuses existing records based on student ID / email).
- Live college ID card upload with drag & drop preview.
- Human-readable unique registration code generator (e.g. `GAME26-00125`).
- Separate decoupled state machines for Registration and Payment.
- Clean Payment Service boundary with generic provider interface and active Mock development engine.
- Instant QR Code pass and ticket generation upon verified payment.
- 3-Sheet Excel export (`Teams`, `Participants`, `Payments`) with clickable hyperlinks.
- Protected Admin Portal with JWT auth, verification queues, and audit logs.

---

## 2. SYSTEM ARCHITECTURE & SEPARATION

The overall event platform is split into two independent parts:

```
+-------------------------------------------------------------------+
|                           PART 1 (THIS PROJECT)                   |
|  - Public Game Portal & Rules      - Strict 5-6 Player Teams      |
|  - SFIT Email Domain Guard         - Student Deduplication Engine |
|  - ID Card Upload & Verification   - Registration State Machine   |
|  - QR Code & Ticket Generator      - Combined PDF Confirmation    |
|  - Nodemailer / In-App Email Logs  - ExcelJS 3-Sheet Exporter     |
|  - Admin Dashboard & JWT Auth      - Generic Payment Boundary     |
+-------------------------------------------------------------------+
                                  │
                       Normalized Payment Contract
                       (shared/payment-contract/)
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                     PART 2 (FRIEND'S MODULE)                      |
|  - Razorpay / Cashfree SDK         - UPI QR & Intent Deep Links   |
|  - Bank Webhook Validation         - Real Merchant Credentials    |
|  - Payment Settlement Verification - Bank UTR Verification        |
+-------------------------------------------------------------------+
```

> **CRITICAL RULE:** Part 1 contains zero vendor-locked Razorpay logic. It communicates exclusively via `PaymentService.js`. See `PAYMENT_INTEGRATION.md` for the exact integration specification.

---

## 3. TECH STACK

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Motion, Lucide React, Space Grotesk, Silkscreen, Press Start 2P.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB Atlas with Mongoose schemas + resilient zero-setup in-memory fallback store.
- **Authentication:** JSON Web Tokens (JWT) for Admin session security.
- **Office / Export:** ExcelJS for formatted multi-sheet `.xlsx` workbooks with live hyperlinks.
- **QR Code & PDF:** QRCode library and jsPDF for printable passes.
- **Packaging:** Archiver for automated ZIP creation.

---

## 4. FOLDER STRUCTURE

```
event-registration-system/
├── backend/
│   └── src/
│       ├── config/              # Event rules & Database connection
│       ├── controllers/         # Admin, Registration, Payment controllers
│       ├── middleware/          # JWT Admin Authentication
│       ├── models/              # Mongoose Schemas (Game, Student, Team, Payment, etc.)
│       ├── routes/              # Express API endpoints
│       ├── services/            # Core business services
│       │   ├── payment/         # PaymentService, Provider interfaces, Mock provider
│       │   ├── studentService.js
│       │   ├── teamService.js
│       │   ├── registrationService.js
│       │   ├── ticketService.js
│       │   ├── emailService.js
│       │   └── excelService.js
│       └── store/               # In-memory operational store & seed records
├── shared/
│   ├── eventConfig.js           # Centralized event parameters (Dates, Venue, Fees)
│   └── payment-contract/        # Normalized status enums & request/response schemas
├── src/
│   ├── components/              # Retro UI components (Header, Footer, Crewmate motifs)
│   ├── pages/                   # Home, GameInfo, Rules, FAQ, Registration, Status, Admin
│   ├── services/                # Frontend API client
│   ├── App.tsx                  # Client router
│   ├── index.css                # Retro grid & neo-brutalist styling
│   └── main.tsx
├── public/                      # Static assets & generated ZIP
├── server.ts                    # Express + Vite hybrid server on port 3000
├── package.json
├── PAYMENT_INTEGRATION.md       # Handoff guide for the payment developer
└── .env.example
```

---

## 5. LOCAL SETUP & INSTALLATION

### Prerequisites
- Node.js v18+ or v20+
- npm v9+

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd event-registration-system
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Leave values blank for default local mock development)*

### 3. Run Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 6. ADMIN CREDENTIALS & SEED DATA

The system automatically initializes with default credentials:
- **Admin Portal URL:** `http://localhost:3000` (click "Admin Portal" in top bar)
- **Admin Email:** `admin@adg.org`
- **Admin Password:** `Deception@2026`

Pre-seeded sample team:
- **Registration ID:** `GAME26-00101`
- **Team Name:** Cyber Imposters (5 Players, Status: `CONFIRMED`)

---

## 7. MOCK PAYMENT TESTING MODE

When `MOCK_PAYMENT=true` in `.env`:
1. Fill the registration form with 5 or 6 SFIT students (`@student.sfit.ac.in`).
2. On Step 5 (Payment), choose between:
   - **Simulate Instant Mock Payment:** Immediately sets status to `PAID`, marks registration `CONFIRMED`, generates Entry QR Ticket, generates Payment Receipt, and sends mock confirmation email.
   - **Manual UPI Submission:** Enter a 12-digit UTR reference (e.g. `426189012345`) and upload proof. The registration enters `PAYMENT_VERIFICATION` status. Log in to the Admin Portal to view and click **"Verify Payment"**.

---

## 8. DOWNLOAD PROJECT ZIP

The complete Part 1 codebase can be packaged and downloaded anytime via:
- Endpoint: `http://localhost:3000/api/download-zip`
- Or from the Admin Portal / Footer via the "Download Part 1 ZIP" action button.
