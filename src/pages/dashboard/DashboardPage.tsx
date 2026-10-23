import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Pill,
  Bot,
  MapPin,
  QrCode,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  PhoneCall,
  Activity,
  Heart,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import {
  MedicalRecord,
  Appointment,
  Reminder,
  AllergyItem,
  EmergencyCardConfig,
} from '../../types';
import { formatDate, formatTime } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmergencyBanner } from '../../components/common/EmergencyBanner';

export const DashboardPage: React.FC = () => {
  const { user, profile, isDemoUser } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [allergies, setAllergies] = useState<AllergyItem[]>([]);
  const [cardConfig, setCardConfig] = useState<EmergencyCardConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadDashboardData = async () => {
      try {
        const [recs, apts, rems, algs, cfg] = await Promise.all([
          dataService.getRecords(user.id),
          dataService.getAppointments(user.id),
          dataService.getReminders(user.id),
          dataService.getAllergies(user.id),
          dataService.getCardConfig(user.id),
        ]);
        setRecords(recs.slice(0, 3));
        setAppointments(apts.filter(a => a.status === 'upcoming').slice(0, 2));
        setReminders(rems.slice(0, 3));
        setAllergies(algs);
        setCardConfig(cfg);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  // Calculate profile completion score
  const calculateCompletion = () => {
    if (!profile) return 0;
    let score = 20; // baseline for created account
    if (profile.full_name) score += 15;
    if (profile.blood_group && profile.blood_group !== 'Unknown') score += 15;
    if (profile.date_of_birth) score += 15;
    if (profile.phone_number) score += 15;
    if (allergies.length > 0) score += 10;
    if (records.length > 0) score += 10;
    return Math.min(100, score);
  };

  const completionPct = calculateCompletion();

  const handleCompleteReminder = async (id: string) => {
    await dataService.updateReminder(id, {
      last_completed_at: new Date().toISOString(),
    });
    setReminders(prev =>
      prev.map(r =>
        r.id === id ? { ...r, last_completed_at: new Date().toISOString() } : r
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* 24/7 Rapid Action Emergency Lifeline Banner */}
      <EmergencyBanner />

      {/* Welcome & Profile Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-teal-600/20">
            {profile?.full_name?.charAt(0) || 'H'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Hello, {profile?.full_name || 'Patient'}
              </h1>
              {isDemoUser && (
                <span className="bg-rosepink-100 text-rosepink-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rosepink-200">
                  Demo Account
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Welcome back to your healthcare dashboard • Blood Group:{' '}
              <span className="font-bold text-red-600">
                {profile?.blood_group || 'Unknown'}
              </span>
            </p>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="w-full sm:w-64 bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700">Profile Completion</span>
            <span className="font-bold text-teal-700">{completionPct}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          {completionPct < 100 && (
            <Link
              to="/profile"
              className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold block mt-1.5"
            >
              Complete remaining details →
            </Link>
          )}
        </div>
      </div>

      {/* Quick Action Shortcuts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link to="/records/upload" className="group">
          <Card hoverEffect className="p-4 text-center h-full flex flex-col items-center justify-center">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Upload Report</span>
            <span className="text-[10px] text-slate-400">PDF, JPG, PNG</span>
          </Card>
        </Link>

        <Link to="/emergency-card" className="group">
          <Card hoverEffect className="p-4 text-center h-full flex flex-col items-center justify-center">
            <div className="w-11 h-11 rounded-2xl bg-rosepink-100 text-rosepink-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Emergency QR</span>
            <span className="text-[10px] text-slate-400">View & Configure</span>
          </Card>
        </Link>

        <Link to="/ai-assistant" className="group">
          <Card hoverEffect className="p-4 text-center h-full flex flex-col items-center justify-center">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">AI Assistant</span>
            <span className="text-[10px] text-slate-400">Ask Health Questions</span>
          </Card>
        </Link>

        <Link to="/nearby" className="group">
          <Card hoverEffect className="p-4 text-center h-full flex flex-col items-center justify-center">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Nearby Care</span>
            <span className="text-[10px] text-slate-400">Hospitals & Clinics</span>
          </Card>
        </Link>
      </div>

      {/* Main Dashboard Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Appointments & Medications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Medication Reminders */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Today's Medication Schedule
                </h3>
              </div>
              <Link
                to="/reminders"
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {reminders.length > 0 ? (
              <div className="space-y-3">
                {reminders.map(rem => {
                  const isCompletedToday =
                    rem.last_completed_at &&
                    new Date(rem.last_completed_at).toDateString() ===
                      new Date().toDateString();

                  return (
                    <div
                      key={rem.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isCompletedToday
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{rem.title}</p>
                          <p className="text-[11px] text-slate-500">
                            Scheduled at {formatTime(rem.scheduled_time)}{' '}
                            {rem.notes && `• ${rem.notes}`}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={isCompletedToday ? 'outline' : 'primary'}
                        onClick={() => handleCompleteReminder(rem.id)}
                        disabled={Boolean(isCompletedToday)}
                        className="text-xs shrink-0"
                      >
                        {isCompletedToday ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Taken</span>
                          </>
                        ) : (
                          <span>Mark Taken</span>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No active medication reminders scheduled for today.
              </div>
            )}
          </Card>

          {/* Upcoming Appointments */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Upcoming Doctor Visits
                </h3>
              </div>
              <Link
                to="/appointments"
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {apt.doctor_name}
                        </span>
                        {apt.specialty && (
                          <Badge variant="teal">{apt.specialty}</Badge>
                        )}
                      </div>
                      <p className="text-slate-600 mt-1">{apt.purpose}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {apt.clinic_or_hospital || apt.location_address}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="font-bold text-teal-800 text-xs">
                        {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 mt-1">
                        Confirmed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No upcoming appointments.
              </div>
            )}
          </Card>

          {/* Recent Medical Records */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Recent Health Records
                </h3>
              </div>
              <Link
                to="/records"
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
              >
                <span>All Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {records.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {records.map(rec => (
                  <div key={rec.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{rec.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {formatDate(rec.record_date)} • {rec.doctor_name || 'Clinic'}
                      </p>
                    </div>
                    <Badge variant="slate" className="capitalize text-[11px]">
                      {rec.record_type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No medical records uploaded yet.
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 col): Emergency Health Card Mini-Preview & Safety */}
        <div className="space-y-6">
          {/* Emergency Card Shortcut Card */}
          <Card className="p-5 border-teal-200/80 bg-gradient-to-b from-teal-50/40 to-white">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Emergency Health Card</h3>
                <p className="text-[10px] text-teal-700 font-semibold">Opaque Bearer QR Active</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              First responders can scan your QR code to instantly see user-approved vitals:
            </p>

            <div className="space-y-2 text-xs mb-4">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Blood Group</span>
                <span className="font-bold text-red-600">{profile?.blood_group || 'Unknown'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Known Allergies</span>
                <span className="font-semibold text-slate-800">
                  {allergies.length > 0 ? `${allergies.length} documented` : 'None'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Emergency Status</span>
                <span className="text-emerald-700 font-bold">QR Token Active</span>
              </div>
            </div>

            <Link to="/emergency-card">
              <Button variant="primary" size="sm" className="w-full text-xs">
                <span>Open Full Emergency Card</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </Card>

          {/* AI Health Assistant Quick Launcher */}
          <Card className="p-5 bg-gradient-to-b from-rosepink-50/40 to-white border-rosepink-200/60">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-rosepink-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">HerCare AI Health Guide</h3>
                <p className="text-[10px] text-rosepink-600 font-semibold">Educational Assistant</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Have questions about symptoms, medications, or preparing for an OB/GYN visit? Ask the AI assistant.
            </p>

            <Link to="/ai-assistant">
              <Button variant="secondary" size="sm" className="w-full text-xs">
                <span>Start AI Consultation</span>
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};
