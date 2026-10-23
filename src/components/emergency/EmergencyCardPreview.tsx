import React from 'react';
import { Shield, AlertCircle, HeartPulse, Pill, Phone, User, Calendar } from 'lucide-react';
import { UserProfile, AllergyItem, MedicalHistoryItem, Medication, EmergencyContact, EmergencyCardConfig } from '../../types';
import { formatDate } from '../../lib/utils';
import { Badge } from '../common/Badge';

interface EmergencyCardPreviewProps {
  profile: UserProfile | null;
  config: EmergencyCardConfig;
  allergies: AllergyItem[];
  conditions: MedicalHistoryItem[];
  medications: Medication[];
  primaryContact?: EmergencyContact;
}

export const EmergencyCardPreview: React.FC<EmergencyCardPreviewProps> = ({
  profile,
  config,
  allergies,
  conditions,
  medications,
  primaryContact,
}) => {
  return (
    <div className="bg-white rounded-3xl border-2 border-teal-600/30 shadow-card overflow-hidden transition-all max-w-xl mx-auto">
      {/* Header Band */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-teal-800 text-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] tracking-widest uppercase font-semibold text-teal-100">
                OFFICIAL PATIENT EMERGENCY IDENTIFICATION
              </div>
              <h2 className="text-xl font-bold tracking-tight">HerCare Emergency Health Card</h2>
            </div>
          </div>
          {config.share_blood_group && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-teal-100 font-semibold">Blood Group</div>
              <span className="inline-block px-3 py-1 bg-red-600 text-white font-extrabold text-base rounded-xl shadow-sm">
                {profile?.blood_group || 'Unknown'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-5 bg-gradient-to-b from-white to-slate-50/50">
        {/* Patient Name & Emergency Notes */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs text-slate-400 font-medium">Patient Legal Name</div>
            <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              {config.share_name ? profile?.full_name || 'Patient' : 'Identity Masked for Privacy'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Last Card Update</div>
            <div className="text-xs text-slate-600 flex items-center justify-end gap-1 mt-0.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(config.updated_at || new Date().toISOString())}
            </div>
          </div>
        </div>

        {/* Emergency Clinical Notes */}
        {config.emergency_notes && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-xl">
            <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              First Responder Alert
            </div>
            <p className="text-xs text-red-900 font-medium leading-relaxed">
              {config.emergency_notes}
            </p>
          </div>
        )}

        {/* Allergies */}
        {config.share_allergies && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>Known Severe Allergies</span>
            </div>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allergies.map(a => (
                  <Badge
                    key={a.id}
                    variant={a.severity === 'anaphylactic' ? 'red' : a.severity === 'severe' ? 'pink' : 'amber'}
                    className="py-1 px-3 text-xs font-semibold"
                  >
                    {a.allergen} {a.reaction ? `(${a.reaction})` : ''}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">No allergies registered.</div>
            )}
          </div>
        )}

        {/* Medical Conditions */}
        {config.share_conditions && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-teal-600" />
              <span>Active Medical Conditions</span>
            </div>
            {conditions.filter(c => c.is_active).length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
                {conditions
                  .filter(c => c.is_active)
                  .map(c => (
                    <li key={c.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                      <span className="font-semibold text-slate-900">{c.title}</span>
                      {c.description && <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{c.description}</p>}
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="text-xs text-slate-400 italic">No active conditions reported.</div>
            )}
          </div>
        )}

        {/* Current Medications */}
        {config.share_medications && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>Critical Active Medications</span>
            </div>
            {medications.filter(m => m.is_active).length > 0 ? (
              <div className="space-y-1.5">
                {medications
                  .filter(m => m.is_active)
                  .map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{m.name}</span>
                        <span className="text-slate-500 ml-2">({m.dosage})</span>
                      </div>
                      <span className="text-[11px] text-teal-700 font-medium">{m.frequency}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">No active medications listed.</div>
            )}
          </div>
        )}

        {/* Primary Emergency Contact */}
        {config.share_primary_contact && primaryContact && (
          <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                Primary Emergency Contact
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {primaryContact.name} ({primaryContact.relationship})
              </div>
            </div>
            <a
              href={`tel:${primaryContact.phone_number}`}
              className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              <span>{primaryContact.phone_number}</span>
            </a>
          </div>
        )}
      </div>

      {/* Footer Security Notice */}
      <div className="bg-slate-100/90 border-t border-slate-200 px-6 py-3 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Bearer-token access configured by patient</span>
        <span className="font-semibold text-teal-700">HerCare Security Protocol</span>
      </div>
    </div>
  );
};
