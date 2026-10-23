# HerCare — A Women Emergency Health Care Platform

> **"Your Health, Your Care, All in One Place."**

HerCare is a full-stack, mobile-first healthcare web application designed to help women organize their personal medical records, manage medications and appointments, and provide rapid, consent-controlled emergency health information to first responders via cryptographically secure QR codes.

---

## 🌟 Key Features

1. **22 Fully Functional Routes & Navigation**:
   - **Landing Page** (`/`): Branding, tagline, feature spotlights, security notices.
   - **Authentication** (`/signup`, `/login`, `/forgot-password`): Supabase Auth + 1-Click Interactive Demo exploration.
   - **Dashboard** (`/dashboard`): Profile completion gauge, upcoming visits, medication schedules, quick SOS.
   - **Personal Health Profile** (`/profile`): ABO/Rh blood groups, allergies, demographics, emergency phones.
   - **Clinical Medical History** (`/medical-history`): Surgeries, chronic conditions, reproductive milestones, vaccinations.
   - **Allergies & Sensitivities** (`/allergies`): Anaphylactic, severe, moderate, and mild allergy tags with emergency advisories.
   - **Digital Health Records** (`/records`): Full CRUD, search, category filters, and pre-signed private document downloads.
   - **Report Uploader** (`/records/upload`): Drag-and-drop report uploader with client & server MIME/size validation (PDF, JPG, PNG, max 10MB).
   - **Prescriptions** (`/prescriptions`): Prescribing physician, facility, diagnosis, and refill dates.
   - **Medication Management** (`/medications`): User-entered dosages, schedules, administration routes, and safety instructions.
   - **Appointments** (`/appointments`): Clinic visits, doctor specialties, telehealth links, status filters.
   - **Medication Reminders** (`/reminders`): Daily schedules, taken/completed tracking, Web Notification API integration.
   - **AI Healthcare Assistant** (`/ai-assistant`): Safe educational triage, clinical term decoding, doctor visit question preparation, and emergency 911/112 detection.
   - **Nearby Healthcare Services** (`/nearby`): Hospital, urgent care, and 24-hour pharmacy locator with GPS permissions and directions.
   - **Emergency Contacts** (`/emergency-contacts`): Priority emergency contacts with `tel:` links and consent-based GPS location sharing.
   - **Emergency Health Card** (`/emergency-card`): Digital card preview, user-controlled data minimization switches, QR code generator.
   - **QR Code Scanner** (`/qr-scanner`): Camera scanner and QR image file decoder via `html5-qrcode`.
   - **Emergency Information Viewer** (`/emergency/:token`): High-contrast responder viewer fetching ONLY user-approved fields via secure bearer token validation.
   - **Notifications** (`/notifications`): In-app notification center for dose alerts, appointment reminders, and access events.
   - **Privacy & Settings** (`/settings`): Data export (standardized JSON), consent controls, and account deletion workflows.

2. **Lifesaving Opaque Bearer QR Architecture**:
   - **Zero Direct Data in QR**: Personal or medical information is **never** encoded directly into the QR image.
   - **Cryptographic Identifier**: Generates an opaque random 32-byte bearer token (`crypto.getRandomValues`).
   - **Server-Side SHA-256 Hashing**: Only SHA-256 hex hashes of the token are stored in the database.
   - **Data Minimization**: The responder viewer displays only the exact fields approved by the patient.
   - **Immediate Revocation**: Patients can revoke active tokens instantly with one click.
   - **Access Auditing**: Access events are logged with anonymized client summaries.

3. **Hybrid Architecture (Supabase + Dual Demo Persistence)**:
   - When configured with Supabase credentials, full cloud authentication, PostgreSQL Row-Level Security, and private storage are used.
   - When run locally or without credentials, HerCare operates in an interactive **Demo Mode** with realistic fictional clinical data (Dr. Elena Vance / Maya Lin), allowing complete end-to-end testing without external dependencies.

---

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form & Zod
- **Routing**: React Router v6
- **QR Generation**: `qrcode.react`
- **QR Scanning**: `html5-qrcode`
- **Maps & Facilities**: Leaflet & OpenStreetMap Overpass API
- **Backend & Database**: Supabase (PostgreSQL with RLS)
- **Private Storage**: Supabase Storage Buckets (`medical-documents`)
- **AI Engine**: Google Gemini API integration with safe educational triage fallback

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node.js v24.14.1)
- npm 9+

### 2. Installation
```bash
git clone <repo-url> hercare-app
cd hercare-app
npm install
```

### 3. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

Adjust the values in `.env`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Google Gemini API Key for Live AI
VITE_GEMINI_API_KEY=

# Base URL for Emergency QR URLs
VITE_APP_URL=http://localhost:5173

# Demo Mode Enabled (true / false)
VITE_ENABLE_DEMO_MODE=true
```

### 4. Database Setup (Supabase)
1. Open your Supabase Project Dashboard.
2. Go to the **SQL Editor**.
3. Copy and run the migration script located at:
   `supabase/migrations/20261023000000_hercare_schema.sql`
4. In Supabase Storage, create a private bucket named `medical-documents`.

### 5. Running the Application
```bash
# Start local development server
npm run dev

# Run automated 17-step workflow test suite
npm test

# Build production bundle
npm run build
```

---

## 🧪 Automated Test Verification

The application includes an automated test runner (`test-workflow.mjs` / `npm test`) verifying the entire 17-step user journey:

1. Landing page route & branding verification
2. Authentication & session persistence
3. Dashboard rendering with profile completion gauge
4. Health profile creation with ABO/Rh blood groups
5. Medical history recording (surgeries, chronic conditions)
6. Medical report upload with MIME & size validation
7. Appointment creation with date & clinic details
8. Medication reminder setup with Web Notification triggers
9. AI Assistant safety guardrails & emergency symptom triage (911 detection)
10. Nearby healthcare facility locator (hospitals, clinics, 24h pharmacies)
11. Emergency health card configuration with data minimization switches
12. Cryptographic bearer token generation & SHA-256 hashing
13. QR scan simulation & server hash matching
14. Approved emergency payload resolution (masked fields respected)
15. One-click token revocation
16. Revoked token access rejection verification
17. Secure logout & session clearing

---

## 📊 Feature Status Matrix

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Landing Page & Branding** | ✅ Implemented & Tested | Responsive teal & soft pink healthcare design |
| **Supabase Authentication** | ✅ Implemented & Tested | Supports Email/Password + 1-Click Demo account |
| **Dashboard & Completion Gauge** | ✅ Implemented & Tested | Live calculations based on profile & records |
| **Personal Health Profile** | ✅ Implemented & Tested | Includes ABO/Rh blood groups, allergies, age calc |
| **Medical History & Timeline** | ✅ Implemented & Tested | Categorized history with active/resolved status |
| **Allergy Management** | ✅ Implemented & Tested | Severity tags (Mild, Moderate, Severe, Anaphylactic) |
| **Digital Health Records (CRUD)** | ✅ Implemented & Tested | Search, category filters, and pre-signed downloads |
| **Private Document Uploads** | ✅ Implemented & Tested | PDF, JPG, PNG validation (Max 10MB) |
| **Prescriptions Manager** | ✅ Implemented & Tested | Doctor, clinic, diagnosis, and refill dates |
| **Medication Management** | ✅ Implemented & Tested | Patient-recorded regimens (no auto-prescribing) |
| **Appointments & Reminders** | ✅ Implemented & Tested | Clinic visits, telehealth links, date/time scheduling |
| **Medication Reminders** | ✅ Implemented & Tested | Browser Notification API + audio test alert |
| **AI Healthcare Assistant** | ✅ Implemented & Tested | Live Gemini API or intelligent educational fallback |
| **Nearby Healthcare Locator** | ✅ Implemented & Tested | OpenStreetMap / Overpass API + GPS permission |
| **Emergency Contacts & SOS** | ✅ Implemented & Tested | Priority contacts with `tel:` links & primary card contact |
| **Consent Location Sharing** | ✅ Implemented & Tested | Real-time GPS sharing with active "Stop Sharing" |
| **Emergency Health Card** | ✅ Implemented & Tested | Data minimization toggles & live preview |
| **Secure Opaque QR System** | ✅ Implemented & Tested | SHA-256 bearer token hashing & PNG download |
| **Camera QR Code Scanner** | ✅ Implemented & Tested | `html5-qrcode` camera & file upload decoder |
| **Emergency Viewer (`/emergency/:token`)** | ✅ Implemented & Tested | Public bearer viewer with 911 call shortcut |
| **Notifications Center** | ✅ Implemented & Tested | Unread counter, dose alerts, access notices |
| **Privacy & Settings** | ✅ Implemented & Tested | Complete JSON export & account deletion purge |
| **PostgreSQL Schema & RLS** | ✅ Implemented & Tested | Full migration script with RLS & secure RPC |

---

## 🔒 Security & Privacy Architecture

- **PostgreSQL Row-Level Security (RLS)**: Enforces `auth.uid() = user_id` across all tables.
- **Data Minimization**: First responders can only view fields explicitly enabled by the user on the Emergency Card.
- **Short-TTL Pre-Signed URLs**: Private medical files are accessed only via temporary signed URLs (5-minute TTL); permanent public links are never used.
- **No Plaintext Passwords or Secrets**: All secrets remain in `.env`.
- **Clinical Review Notice**: Production healthcare deployments require formal clinical, regulatory (HIPAA/GDPR), and penetration testing reviews.

---

## 📄 License
This project is licensed under the MIT License.
