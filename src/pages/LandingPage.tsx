import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Shield,
  QrCode,
  Calendar,
  Pill,
  Bot,
  MapPin,
  Lock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const { loginAsDemo } = useAuth();

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Subtle decorative blurs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-rosepink-100/60 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-6 shadow-sm">
              <Heart className="w-3.5 h-3.5 fill-rosepink-200 text-teal-600" />
              <span>HerCare — A Women Emergency Health Care</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Your Health, Your Care,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600">
                All in One Place.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              HerCare is a modern, privacy-focused healthcare platform empowering women to manage personal medical records, track prescriptions and appointments, and provide immediate, secure health details to first responders during emergencies.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>

              <button
                type="button"
                onClick={loginAsDemo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rosepink-100 hover:bg-rosepink-200 text-rosepink-600 border border-rosepink-200 text-base font-semibold px-6 py-3 rounded-xl transition-all shadow-sm"
              >
                <Sparkles className="w-5 h-5" />
                <span>Explore Interactive Demo</span>
              </button>

              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                  <span>Sign In</span>
                </Button>
              </Link>
            </div>

            {/* Trust highlights */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-teal-600" />
                Row-Level Security (RLS)
              </span>
              <span className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-teal-600" />
                Opaque Tokenized Emergency QR
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-teal-600" />
                Private Encrypted Storage
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* EMERGENCY FEATURE SPOTLIGHT */}
      <section className="py-16 bg-gradient-to-b from-white to-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider mb-4 border border-red-200/60">
                <AlertCircle className="w-4 h-4" />
                Lifesaving Emergency Architecture
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Emergency Health Card with Opaque Bearer QR Access
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                In critical medical emergencies, every second counts. HerCare generates a privacy-preserving QR code containing an opaque cryptographic bearer token. 
              </p>
              <ul className="mt-6 space-y-3.5 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Zero Direct Data in QR:</strong> Personal medical data is never embedded directly in the QR code image.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>User-Controlled Consent:</strong> You decide exactly which fields are visible (blood group, allergies, conditions, primary contact).</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Instant Revocation & Expiration:</strong> Cancel access or set expiration dates at any time with one click.</span>
                </li>
              </ul>

              <div className="mt-8 flex items-center gap-4">
                <Link to="/emergency-card">
                  <Button variant="primary" size="md">
                    <QrCode className="w-4 h-4" />
                    <span>See Emergency Card</span>
                  </Button>
                </Link>
                <Link to="/qr-scanner">
                  <Button variant="outline" size="md">
                    <span>Test QR Scanner</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Card Mockup */}
            <div className="relative">
              <div className="p-6 bg-white rounded-3xl shadow-card border border-teal-100 max-w-md mx-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Emergency Health Card</h4>
                      <p className="text-[11px] text-teal-700 font-semibold">Active & Verified</p>
                    </div>
                  </div>
                  <span className="bg-red-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg">
                    Blood: O+
                  </span>
                </div>

                <div className="py-4 space-y-3 text-xs">
                  <div className="bg-red-50 text-red-800 p-2.5 rounded-xl border border-red-200">
                    <span className="font-bold">Severe Allergy: </span>Penicillin (Anaphylaxis risk)
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="font-bold">Chronic Condition: </span>Mild Intermittent Asthma
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="font-bold">Active Medication: </span>Albuterol Inhaler 90mcg
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Emergency Contact:</span>
                  <span className="font-bold text-slate-800">David Lin (Brother) • +1 (555) 345-6789</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
            Comprehensive Healthcare Platform
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
            Engineered for Everyday Care & Rapid Response
          </h2>
          <p className="text-sm text-slate-500 mt-3">
            All the tools you need to take charge of your medical journey, without friction or complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card hoverEffect className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Digital Health Records</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Store lab reports, imaging scans, and clinical notes securely. Filter by category, organize by date, and download authorized files whenever you need them.
            </p>
          </Card>

          <Card hoverEffect className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-rosepink-50 text-rosepink-600 flex items-center justify-center mb-4">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Medications & Prescriptions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track user-entered dosages, schedules, and prescribing doctors. Keep an up-to-date medication list to prevent dangerous drug interactions.
            </p>
          </Card>

          <Card hoverEffect className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Appointments & Reminders</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Schedule clinic visits, telehealth calls, and set daily browser medication reminders with sound alerts so you never miss a dose.
            </p>
          </Card>

          <Card hoverEffect className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">AI Healthcare Assistant</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ask medical questions, decode clinical jargon, and prepare thoughtful questions for your physician, with strict triage guardrails and emergency recognition.
            </p>
          </Card>

          <Card hoverEffect className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Nearby Healthcare Facilities</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Locate verified hospitals, urgent care centers, and 24-hour pharmacies near your device GPS or manual location with one-click directions.
            </p>
          </Card>

          <Card hoverEffect className="p-6">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Emergency Contacts & SOS</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Designate priority emergency contacts with direct phone dial links and consent-based GPS location sharing with active 'Stop Sharing' controls.
            </p>
          </Card>
        </div>
      </section>

      {/* HOW HERCARE WORKS */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900">How HerCare Works</h2>
            <p className="text-sm text-slate-500 mt-2">
              Three simple steps to peace of mind and proactive healthcare management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-teal-600/20">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Create Your Health Profile</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add your blood group, known allergies, chronic conditions, and emergency contacts. Upload clinical PDFs or scans into your private vault.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-teal-600/20">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Configure Emergency Card</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select exactly which data points can be viewed in an emergency. Generate an opaque QR code for your physical wallet, lock screen, or bracelet.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-teal-600/20">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Manage Care Daily</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track prescriptions, receive medication alerts, prepare for doctor appointments with AI, and rest easy knowing your emergency lifeline is ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-extrabold text-base">
                <Heart className="w-5 h-5 text-teal-400 fill-teal-400" />
                <span>HerCare</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                HerCare — A Women Emergency Health Care platform dedicated to accessible, dignified, and secure health management.
              </p>
            </div>

            <div>
              <div className="font-bold text-white text-sm mb-3">Quick Links</div>
              <ul className="space-y-2">
                <li><Link to="/dashboard" className="hover:text-teal-400">Dashboard</Link></li>
                <li><Link to="/emergency-card" className="hover:text-teal-400">Emergency Health Card</Link></li>
                <li><Link to="/qr-scanner" className="hover:text-teal-400">QR Scanner</Link></li>
                <li><Link to="/ai-assistant" className="hover:text-teal-400">AI Assistant</Link></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-white text-sm mb-3">Security & Privacy</div>
              <ul className="space-y-2">
                <li><Link to="/settings" className="hover:text-teal-400">Privacy Settings</Link></li>
                <li><span className="text-slate-500">Row-Level Security Active</span></li>
                <li><span className="text-slate-500">Opaque Bearer Token Protocol</span></li>
                <li><span className="text-slate-500">No Plaintext Storage</span></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-white text-sm mb-3">Medical Disclaimer</div>
              <p className="text-slate-400 leading-relaxed">
                HerCare is a patient health management and emergency information viewer tool. It does not provide medical diagnosis, treatment, or professional clinical advice. For emergencies, always dial 911/112/108 immediately.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <p>© {new Date().getFullYear()} HerCare Healthcare Platform. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/settings" className="hover:text-slate-300">Privacy Policy</Link>
              <Link to="/settings" className="hover:text-slate-300">Terms of Use</Link>
              <Link to="/nearby" className="hover:text-slate-300">Emergency Locator</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
