import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertCircle,
  PhoneCall,
  User,
  HeartPulse,
  Pill,
  Calendar,
  Lock,
  Phone,
  AlertOctagon,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Info,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { EmergencyCardViewData } from '../../types';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const EmergencyViewerPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<EmergencyCardViewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setData({
        success: false,
        error: 'NO_TOKEN',
        message: 'No emergency token was provided in the URL.',
      });
      setLoading(false);
      return;
    }

    const resolve = async () => {
      setLoading(true);
      try {
        const result = await dataService.resolveEmergencyToken(token);
        setData(result);
      } catch (err: any) {
        setData({
          success: false,
          error: 'SYSTEM_ERROR',
          message: err.message || 'Unable to resolve emergency token.',
        });
      } finally {
        setLoading(false);
      }
    };

    resolve();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center animate-pulse mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-800">Verifying Emergency Bearer Token...</p>
        <p className="text-xs text-slate-400 mt-1">Inspecting cryptographic signature and revocation status</p>
      </div>
    );
  }

  // Error / Revoked / Expired States (Requirement 9: Never fall back to sample card)
  if (!data || !data.success) {
    const isRevoked = data?.error === 'REVOKED_TOKEN';
    const isExpired = data?.error === 'EXPIRED_TOKEN';
    const isBackendConfig = data?.error === 'BACKEND_NOT_CONFIGURED';

    return (
      <div className="min-h-[70vh] max-w-lg mx-auto p-4 flex flex-col justify-center">
        <Card className="p-8 text-center border-red-200 bg-red-50/30">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {isRevoked
              ? 'Emergency Access Revoked'
              : isExpired
              ? 'Emergency Token Expired'
              : isBackendConfig
              ? 'Database Backend Required'
              : 'Invalid Emergency Token'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
            {data?.message || 'The emergency token provided does not match any active authorized record.'}
          </p>

          {!isRevoked && !isExpired && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 text-left mb-5 space-y-1">
              <span className="font-bold block text-amber-950">Security & Architecture Notice:</span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Live cross-device emergency cards cannot use browser localStorage as a source of truth because browser storage is restricted to a single device. Production emergency responder verification requires connecting your Supabase PostgreSQL backend with the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">get_emergency_card_by_token</code> RPC function.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-red-200/60 flex flex-col sm:flex-row gap-2.5 justify-center">
            <a
              href="tel:911"
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md shadow-red-600/20"
            >
              <PhoneCall className="w-4 h-4 fill-current" />
              <span>Call Emergency (911 / 112)</span>
            </a>

            <Link to="/">
              <Button variant="outline" size="md" className="w-full sm:w-auto text-xs">
                <span>HerCare Home</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Display Emergency Card (Separating Demo vs Live - Requirement 10)
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      {/* DEMO CARD NOTICE BANNER */}
      {data.is_demo ? (
        <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
              SAMPLE DEMONSTRATION RECORD
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              This card displays fictional demonstration information for testing and preview purposes. It contains no real patient records and does not query actual user data.
            </p>
          </div>
        </div>
      ) : (
        /* LIVE FIRST RESPONDER BANNER */
        <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl p-4 shadow-lg shadow-red-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] tracking-widest uppercase font-semibold text-red-100">
                FIRST RESPONDER VERIFIED
              </div>
              <div className="text-sm font-bold">Patient Emergency Vitals</div>
            </div>
          </div>

          <a
            href="tel:911"
            className="bg-white text-red-600 font-extrabold px-3.5 py-1.5 rounded-xl text-xs hover:bg-red-50 shadow-sm transition-all"
          >
            Call 911 / 112
          </a>
        </div>
      )}

      {/* Main Patient Emergency Health Card */}
      <div className="bg-white rounded-3xl border-2 border-teal-600/30 shadow-card overflow-hidden">
        {/* Header */}
        <div
          className={
            data.is_demo
              ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-5'
              : 'bg-gradient-to-r from-teal-700 via-teal-600 to-teal-800 text-white p-5'
          }
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-semibold text-white/80 tracking-wider">
                {data.is_demo ? 'Demonstration Health Card' : 'Emergency Information Viewer'}
              </div>
              <h1 className="text-xl font-bold tracking-tight mt-0.5">
                {data.full_name || 'Patient'}
              </h1>
            </div>

            {data.blood_group && (
              <div className="text-right">
                <div className="text-[10px] uppercase text-white/80 font-semibold">Blood Group</div>
                <span className="inline-block px-3 py-1 bg-red-600 text-white font-black text-lg rounded-xl shadow-sm">
                  {data.blood_group}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5 bg-gradient-to-b from-white to-slate-50/50">
          {/* Emergency Alert Notes */}
          {data.emergency_notes && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl">
              <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>First Responder Critical Advisory</span>
              </div>
              <p className="text-xs text-red-950 font-medium leading-relaxed">
                {data.emergency_notes}
              </p>
            </div>
          )}

          {/* Primary Emergency Contact */}
          {data.primary_contact && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  Primary Emergency Contact
                </div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {data.primary_contact.name} ({data.primary_contact.relationship})
                </div>
              </div>

              <a
                href={`tel:${data.primary_contact.phone_number}`}
                className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all"
              >
                <PhoneCall className="w-4 h-4 fill-current" />
                <span>Call {data.primary_contact.phone_number}</span>
              </a>
            </div>
          )}

          {/* Allergies */}
          {data.allergies && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-500" />
                <span>Documented Severe Allergies</span>
              </div>
              {data.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.allergies.map((alg, i) => (
                    <Badge
                      key={i}
                      variant={alg.severity === 'anaphylactic' ? 'red' : 'pink'}
                      className="py-1 px-3 text-xs font-bold"
                    >
                      {alg.allergen} {alg.reaction ? `— ${alg.reaction}` : ''}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No allergies registered.</p>
              )}
            </div>
          )}

          {/* Conditions */}
          {data.conditions && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <span>Active Medical Conditions</span>
              </div>
              {data.conditions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {data.conditions.map((cond, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-900">{cond.title}</div>
                      {cond.description && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{cond.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No active conditions reported.</p>
              )}
            </div>
          )}

          {/* Medications */}
          {data.medications && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>Current Critical Medications</span>
              </div>
              {data.medications.length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  {data.medications.map((med, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{med.name}</span>
                        <span className="text-slate-500 ml-2">({med.dosage})</span>
                      </div>
                      <span className="text-teal-700 font-semibold">{med.frequency}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No active medications registered.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Last Updated: {formatDate(data.last_updated)}</span>
          <span className="font-semibold text-teal-700">HerCare Security Protocol</span>
        </div>
      </div>
    </div>
  );
};
