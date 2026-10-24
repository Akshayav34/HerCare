import React, { useEffect, useState } from 'react';
import {
  QrCode,
  Shield,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  Lock,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  AlertCircle,
  Copy,
  ExternalLink,
  Info,
  Radio,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import {
  EmergencyCardConfig,
  EmergencyCardToken,
  EmergencyAccessLog,
  AllergyItem,
  MedicalHistoryItem,
  Medication,
  EmergencyContact,
} from '../../types';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmergencyCardPreview } from '../../components/emergency/EmergencyCardPreview';
import { QRCodeGenerator } from '../../components/emergency/QRCodeGenerator';
import {
  DEMO_SAMPLE_PLAIN_TOKEN,
  FICTIONAL_SAMPLE_EMERGENCY_CARD,
} from '../../services/mockData';

export const EmergencyCardConfigPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [config, setConfig] = useState<EmergencyCardConfig | null>(null);
  const [allergies, setAllergies] = useState<AllergyItem[]>([]);
  const [conditions, setConditions] = useState<MedicalHistoryItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [tokens, setTokens] = useState<EmergencyCardToken[]>([]);
  const [logs, setLogs] = useState<EmergencyAccessLog[]>([]);
  const [activePlainToken, setActivePlainToken] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(24 * 30); // 30 days
  const [hasUserConsent, setHasUserConsent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'demo'>('live');

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [cfg, algs, hist, meds, cnts, toks, lgList] = await Promise.all([
        dataService.getCardConfig(user.id),
        dataService.getAllergies(user.id),
        dataService.getHistory(user.id),
        dataService.getMedications(user.id),
        dataService.getContacts(user.id),
        dataService.getTokens(user.id),
        dataService.getAccessLogs(user.id),
      ]);
      setConfig(cfg);
      setAllergies(algs);
      setConditions(hist);
      setMedications(meds);
      setContacts(cnts);
      setLogs(lgList);
      setTokens(toks);

      // Check if user has an active, unrevoked, unexpired token
      const active = toks.find(t => !t.is_revoked && new Date(t.expires_at) > new Date());
      const savedPlainToken = localStorage.getItem(`hercare_plain_token_${user.id}`) || '';
      if (active) {
        const tokenToUse = active.plain_token || savedPlainToken || activePlainToken;
        setActivePlainToken(tokenToUse);
        if (tokenToUse) {
          localStorage.setItem(`hercare_plain_token_${user.id}`, tokenToUse);
        }
      } else {
        setActivePlainToken('');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  const handleConfigChange = async (key: keyof EmergencyCardConfig, value: any) => {
    if (!config || !user) return;
    const updated = { ...config, [key]: value };
    setConfig(updated);
  };

  const handleSaveConfig = async () => {
    if (!config || !user) return;
    setIsSavingConfig(true);
    setSaveSuccess(false);
    try {
      await dataService.updateCardConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const hasAtLeastOneFieldSelected = Boolean(
    config &&
      (config.share_name ||
        config.share_blood_group ||
        config.share_allergies ||
        config.share_conditions ||
        config.share_medications ||
        config.share_primary_contact ||
        config.share_secondary_contact ||
        (config.share_emergency_notes && config.emergency_notes && config.emergency_notes.trim().length > 0))
  );

  const handleGenerateNewQR = async () => {
    if (!user) return;
    if (!hasUserConsent) {
      alert('Please check the mandatory consent box before generating your emergency QR code.');
      return;
    }
    if (!hasAtLeastOneFieldSelected) {
      alert('Please select at least one medical field above to include in your emergency card.');
      return;
    }

    setIsGenerating(true);
    try {
      // First save current field selection
      if (config) {
        await dataService.updateCardConfig(config);
      }

      // Generate cryptographically secure bearer token
      const { tokenRecord, plainToken } = await dataService.createEmergencyToken(
        user.id,
        durationHours,
        'Patient Emergency Health Card'
      );

      setActivePlainToken(plainToken);
      localStorage.setItem(`hercare_plain_token_${user.id}`, plainToken);
      setTokens(prev => [tokenRecord, ...prev.filter(t => t.id !== tokenRecord.id)]);
      setHasUserConsent(false); // Reset consent check after generation
      await loadAll();
    } catch (err: any) {
      console.error('Failed to generate emergency QR:', err);
      alert('Failed to generate QR code: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (
      confirm(
        'Revoke this Emergency QR Code immediately? Any responder scanning this code will be immediately blocked and denied access.'
      )
    ) {
      if (!user) return;
      await dataService.revokeEmergencyToken(tokenId, 'Revoked by patient on Emergency Card Settings', user.id);
      setActivePlainToken('');
      await loadAll();
    }
  };

  const activeToken = tokens.find(t => !t.is_revoked && new Date(t.expires_at) > new Date());
  const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
  const secondaryContact = contacts.find(c => !c.is_primary) || (contacts.length > 1 ? contacts[1] : undefined);

  return (
    <div className="space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Emergency Health Card & QR
            </h1>
            {activeToken ? (
              <Badge variant="mint" className="text-xs font-bold py-0.5 px-2.5">
                SHARING ACTIVE
              </Badge>
            ) : (
              <Badge variant="slate" className="text-xs font-bold py-0.5 px-2.5">
                SHARING INACTIVE (PRIVATE)
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure consent-approved emergency medical vitals and generate opaque cryptographic bearer QR codes.
          </p>
        </div>

        {/* Tab Switcher: Live Card vs Fictional Sample Demo */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-white text-teal-800 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            <span>My Emergency Card</span>
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'demo'
                ? 'bg-white text-amber-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-600" />
            <span>Fictional Sample Preview</span>
          </button>
        </div>
      </div>

      {/* DEMO MODE TAB */}
      {activeTab === 'demo' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-950">
                Fictional Demonstration Card (Sample Testing Only)
              </p>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                This demonstration card displays 100% fictional medical vitals (Maya Lin). It is completely isolated and cannot access or modify your personal health records. Responders scanning this demo token will only view hardcoded demonstration data.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Demo Card Showcase */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fictional Responder Card
              </div>
              <div className="bg-white rounded-3xl border-2 border-amber-500/30 shadow-card overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] tracking-widest uppercase font-semibold text-amber-100">
                      FICTIONAL SAMPLE RECORD
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Maya Lin (Sample)</h2>
                  </div>
                  <span className="px-3 py-1 bg-red-600 text-white font-extrabold text-base rounded-xl shadow-sm">
                    O+
                  </span>
                </div>
                <div className="p-6 space-y-4 text-xs">
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-xl">
                    <span className="font-bold text-red-800 block text-[11px]">First Responder Alert</span>
                    <p className="text-red-900 mt-0.5">
                      {FICTIONAL_SAMPLE_EMERGENCY_CARD.emergency_notes}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 block mb-1">Severe Allergies:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {FICTIONAL_SAMPLE_EMERGENCY_CARD.allergies?.map((a, i) => (
                        <Badge key={i} variant="red" className="text-[11px]">
                          {a.allergen} ({a.reaction})
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 block mb-1">Current Medications:</span>
                    <div className="space-y-1">
                      {FICTIONAL_SAMPLE_EMERGENCY_CARD.medications?.map((m, i) => (
                        <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between">
                          <span className="font-semibold text-slate-800">{m.name} ({m.dosage})</span>
                          <span className="text-teal-700 font-medium">{m.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo QR Code */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fixed Demo QR Code
              </div>
              <QRCodeGenerator
                plainToken={DEMO_SAMPLE_PLAIN_TOKEN}
                expiresAt={new Date(Date.now() + 365 * 86400000).toISOString()}
                isRevoked={false}
              />
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600">
                <span className="font-bold block text-slate-800 mb-1">Cross-Device Testing Instructions:</span>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  You can scan this demo QR code with any mobile device camera or navigate directly to{' '}
                  <a
                    href={`/emergency/${DEMO_SAMPLE_PLAIN_TOKEN}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 font-semibold underline"
                  >
                    /emergency/{DEMO_SAMPLE_PLAIN_TOKEN}
                  </a>{' '}
                  to test the mobile first-responder emergency viewer.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE EMERGENCY CARD TAB */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Security Architecture Disclosure */}
          <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-4 text-xs text-teal-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-teal-950">
                Bearer-Token Security Architecture Notice:
              </p>
              <p className="text-teal-800 leading-relaxed text-[11px]">
                Anyone possessing a valid emergency QR token URL may view only the patient-approved information until it expires or is revoked. Medical records are NEVER encoded directly inside the QR pixel image. Only a one-way cryptographic SHA-256 hash is verified by the backend. You can revoke access immediately with one click.
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl p-4 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Emergency Card settings saved successfully.</span>
            </div>
          )}

          {/* Two Column Layout: Controls & Live Card Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Field Permissions & Expiration */}
            <div className="space-y-6">
              <Card className="p-6 space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-600" />
                    <span>Select Authorized Emergency Information</span>
                  </h3>
                  {activeToken ? (
                    <Badge variant="mint" className="text-[10px] font-bold">Active</Badge>
                  ) : (
                    <Badge variant="slate" className="text-[10px]">Inactive</Badge>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  HerCare guarantees data minimization: First responders will only see the fields checked below. Unchecked sections will remain strictly private.
                </p>

                {config && (
                  <div className="space-y-3 pt-1">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-900 block">Full Legal Name</span>
                        <span className="text-slate-400 text-[11px]">Displays {profile?.full_name || 'Patient Name'}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.share_name}
                        onChange={e => handleConfigChange('share_name', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-900 block">Blood Group (ABO/Rh)</span>
                        <span className="text-slate-400 text-[11px]">Displays {profile?.blood_group || 'Unknown'}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.share_blood_group}
                        onChange={e => handleConfigChange('share_blood_group', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-900 block">Known Severe Allergies</span>
                        <span className="text-slate-400 text-[11px]">{allergies.length} allergy records on file</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.share_allergies}
                        onChange={e => handleConfigChange('share_allergies', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-900 block">Active Medical Conditions</span>
                        <span className="text-slate-400 text-[11px]">e.g. Asthma, chronic diagnoses</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.share_conditions}
                        onChange={e => handleConfigChange('share_conditions', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-900 block">Current Critical Medications</span>
                        <span className="text-slate-400 text-[11px]">Rescue inhalers, daily tablets, active Rx</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.share_medications}
                        onChange={e => handleConfigChange('share_medications', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-900 block">Primary Emergency Contact</span>
                        <span className="text-slate-400 text-[11px]">{primaryContact ? primaryContact.name : 'No contact set'}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.share_primary_contact}
                        onChange={e => handleConfigChange('share_primary_contact', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-900 block">Secondary Emergency Contact</span>
                        <span className="text-slate-400 text-[11px]">{secondaryContact ? secondaryContact.name : 'No secondary contact set'}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(config.share_secondary_contact)}
                        onChange={e => handleConfigChange('share_secondary_contact', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-900 block">Share Emergency Notes / Clinical Advisories</span>
                        <span className="text-slate-400 text-[11px]">Explicit consent to expose notes below to first responders</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(config.share_emergency_notes)}
                        onChange={e => handleConfigChange('share_emergency_notes', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>

                    <div className="pt-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        First Responder Emergency Notes
                      </label>
                      <textarea
                        rows={2}
                        value={config.emergency_notes || ''}
                        onChange={e => handleConfigChange('emergency_notes', e.target.value)}
                        placeholder="e.g. Carry EpiPen in handbag, Severe Penicillin allergy, Speaks English & Spanish"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSaveConfig}
                        isLoading={isSavingConfig}
                      >
                        Save Field Settings
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* QR Token Consent, Expiration & Generation */}
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-teal-600" />
                  <span>Generate Cryptographic Emergency QR Code</span>
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Token Expiration Lifespan
                  </label>
                  <select
                    value={durationHours}
                    onChange={e => setDurationHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value={24}>24 Hours (Short-term travel / event)</option>
                    <option value={24 * 7}>7 Days (One week)</option>
                    <option value={24 * 30}>30 Days (Standard 1 Month)</option>
                    <option value={24 * 365}>1 Year (Annual renewal)</option>
                  </select>
                </div>

                {/* Validation Notice if no field is selected */}
                {!hasAtLeastOneFieldSelected && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Please check at least one medical field above before generating a QR code.</span>
                  </div>
                )}

                {/* Explicit Consent Requirement (Requirement 4) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasUserConsent}
                      onChange={e => setHasUserConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900">Mandatory Consent:</strong> I understand and explicitly consent that anyone scanning this bearer QR code or opening the link will be able to view only the medical fields selected above, until this token expires or I revoke it.
                    </span>
                  </label>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGenerateNewQR}
                  disabled={!hasUserConsent || !hasAtLeastOneFieldSelected || isGenerating}
                  isLoading={isGenerating}
                  className="w-full text-xs font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {activeToken ? 'Regenerate New Emergency QR Token' : 'Generate Emergency QR Code'}
                  </span>
                </Button>

                {!hasUserConsent && (
                  <p className="text-[11px] text-slate-400 text-center">
                    Check the mandatory consent box above to enable QR code generation.
                  </p>
                )}
              </Card>
            </div>

            {/* Right Column: Live Card Preview + Active QR Code */}
            <div className="space-y-6">
              {/* Live Card Preview */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Live Responder Card Preview
                </div>
                {config && (
                  <EmergencyCardPreview
                    profile={profile}
                    config={config}
                    allergies={allergies}
                    conditions={conditions}
                    medications={medications}
                    primaryContact={primaryContact}
                    secondaryContact={secondaryContact}
                  />
                )}
              </div>

              {/* Active QR Generator or Inactive State */}
              {activeToken && (activePlainToken || activeToken.plain_token) ? (
                <div className="space-y-3">
                  <QRCodeGenerator
                    plainToken={activePlainToken || activeToken.plain_token || ''}
                    expiresAt={activeToken.expires_at}
                    isRevoked={activeToken.is_revoked}
                    onRevoke={() => handleRevokeToken(activeToken.id)}
                  />

                  {/* Prominent Revocation Button */}
                  <Card className="p-4 bg-red-50/50 border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                        <AlertOctagonIcon className="w-4 h-4 text-red-600" />
                        <span>Instant Access Revocation</span>
                      </div>
                      <div className="text-[11px] text-red-700 mt-0.5">
                        Immediately invalidates this bearer token across all systems.
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRevokeToken(activeToken.id)}
                      className="text-xs font-bold shrink-0"
                    >
                      Revoke QR Code Now
                    </Button>
                  </Card>
                </div>
              ) : (
                <Card className="p-8 text-center border-dashed border-2 border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    Emergency Sharing is Currently Inactive
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-4">
                    Your personal healthcare vitals are completely private. Select the information you want to share, check the consent box, and generate your bearer QR code.
                  </p>
                </Card>
              )}

              {/* Access Logs (Data Minimization Audit) */}
              <Card className="p-6">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-teal-600" />
                    <span>Emergency QR Access History</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Audit Log</span>
                </h3>

                {logs.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs mt-3">
                    {logs.slice(0, 5).map(log => (
                      <div key={log.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">
                            Status:{' '}
                            <span
                              className={
                                log.status === 'granted'
                                  ? 'text-emerald-700 font-bold'
                                  : 'text-red-600 font-bold'
                              }
                            >
                              {log.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {formatDate(log.accessed_at)} • {log.user_agent_summary || 'Browser Client'}
                          </div>
                        </div>
                        <Badge variant={log.status === 'granted' ? 'mint' : 'red'}>
                          {log.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No access events recorded yet. Access attempts will appear here.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function AlertOctagonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
