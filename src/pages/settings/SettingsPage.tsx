import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Shield,
  Download,
  Trash2,
  Bell,
  Volume2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { UserSettings } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    dataService.getSettings(user.id).then(setSettings);
  }, [user]);

  const handleToggle = async (key: keyof UserSettings) => {
    if (!settings || !user) return;
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(updated);
    await dataService.updateSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const data = await dataService.exportUserData(user.id);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `hercare-medical-data-export-${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurgeAccount = async () => {
    if (!user) return;
    if (confirm('CRITICAL ACTION: Are you absolutely certain you want to purge all your personal healthcare data, records, prescriptions, and emergency QR tokens? This action cannot be undone.')) {
      await dataService.purgeAccountData(user.id);
      await logout();
      navigate('/');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Privacy & System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your notification preferences, privacy consent controls, and account data portability
        </p>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl p-3.5 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved.</span>
        </div>
      )}

      {/* Notification Preferences */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-600" />
          <span>Notification & Alert Preferences</span>
        </h3>

        {settings && (
          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block">Browser Push Reminders</span>
                <span className="text-slate-500 text-[11px]">Receive desktop notifications for daily scheduled medication doses</span>
              </div>
              <input
                type="checkbox"
                checked={settings.browser_notifications}
                onChange={() => handleToggle('browser_notifications')}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block">Emergency Card Access Alerts</span>
                <span className="text-slate-500 text-[11px]">Notify me in-app whenever my emergency QR card is viewed via bearer link</span>
              </div>
              <input
                type="checkbox"
                checked={settings.emergency_access_alerts}
                onChange={() => handleToggle('emergency_access_alerts')}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block">Audible Sound Alerts</span>
                <span className="text-slate-500 text-[11px]">Play audio chime when a critical alert or medication time arrives</span>
              </div>
              <input
                type="checkbox"
                checked={settings.sound_alerts}
                onChange={() => handleToggle('sound_alerts')}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
            </label>
          </div>
        )}
      </Card>

      {/* Data Ownership & Export */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Download className="w-4 h-4 text-teal-600" />
          <span>Patient Data Portability (GDPR & HIPAA Compliance)</span>
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          You own 100% of your personal healthcare records. You may export your entire clinical history, allergies, appointments, and emergency card settings as a single standardized JSON file.
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportData}
          isLoading={isExporting}
          className="text-xs font-semibold"
        >
          <Download className="w-4 h-4" />
          <span>Export All Medical Data (.JSON)</span>
        </Button>
      </Card>

      {/* Production & Security Disclosure */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-teal-600" />
          <span>Production Security & Compliance Architecture</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          HerCare is configured with PostgreSQL Row-Level Security (RLS) policies enforcing strict user-ownership guarantees. Medical documents are stored in private storage buckets accessible solely via time-limited signed URLs. Bearer tokens for emergency access are cryptographically hashed using SHA-256 before persistence.
        </p>
        <p className="text-[11px] text-slate-400 italic">
          Disclaimer: Production medical deployments require formal healthcare security, legal, privacy, and clinical review.
        </p>
      </div>

      {/* Danger Zone: Account Deletion */}
      <Card className="p-6 border-red-200 bg-red-50/20 space-y-4">
        <h3 className="text-sm font-bold text-red-900 pb-2 border-b border-red-100 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-600" />
          <span>Danger Zone: Account Deletion</span>
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          Permanently delete your profile, medical records, upload vaults, medication regimens, and revoke all active emergency QR codes immediately.
        </p>

        <Button
          variant="danger"
          size="sm"
          onClick={handlePurgeAccount}
          className="text-xs"
        >
          <span>Delete Account & Purge Healthcare Data</span>
        </Button>
      </Card>
    </div>
  );
};
