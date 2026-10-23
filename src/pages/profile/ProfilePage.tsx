import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Phone, MapPin, Calendar, Heart, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { UserProfile, BloodGroup } from '../../types';
import { calculateAge } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  date_of_birth: z.string().optional(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']),
  phone_number: z.string().optional(),
  emergency_phone: z.string().optional(),
  address: z.string().optional(),
  existing_conditions: z.string().optional(),
  allergies_summary: z.string().optional(),
  current_medications_summary: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      blood_group: 'Unknown',
    },
  });

  const watchedDob = watch('date_of_birth');
  const userAge = calculateAge(watchedDob);

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || '',
        date_of_birth: profile.date_of_birth || '',
        blood_group: profile.blood_group || 'Unknown',
        phone_number: profile.phone_number || '',
        emergency_phone: profile.emergency_phone || '',
        address: profile.address || '',
        existing_conditions: profile.existing_conditions || '',
        allergies_summary: profile.allergies_summary || '',
        current_medications_summary: profile.current_medications_summary || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await dataService.updateProfile({
        id: user.id,
        ...data,
      });
      await refreshProfile();
      setSuccessMsg('Your personal health profile was updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Personal Health Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain your essential clinical information and emergency contact baseline
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl p-4 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-2xl p-4 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Personal Identity Card */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            <span>Demographic & Contact Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                {...register('full_name')}
                placeholder="e.g. Maya Lin"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
              {errors.full_name && (
                <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Blood Group (ABO & Rh Factor) *
              </label>
              <select
                {...register('blood_group')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-semibold"
              >
                <option value="Unknown">Unknown / Not Tested</option>
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-) [Universal Donor]</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+) [Universal Recipient]</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Date of Birth {userAge !== null && `(Age: ${userAge} yrs)`}
              </label>
              <input
                type="date"
                {...register('date_of_birth')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Primary Phone Number
              </label>
              <input
                type="tel"
                {...register('phone_number')}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Direct Emergency Phone
              </label>
              <input
                type="tel"
                {...register('emergency_phone')}
                placeholder="+1 (555) 999-9999"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Residential Address (Optional)
              </label>
              <input
                type="text"
                {...register('address')}
                placeholder="City, State, Postal Code"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </Card>

        {/* Clinical Snapshot Card */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Heart className="w-4 h-4 text-teal-600" />
            <span>Clinical Summary & Emergency Overrides</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Allergies Summary (Drug, Food, Latex)
              </label>
              <textarea
                rows={2}
                {...register('allergies_summary')}
                placeholder="e.g. Penicillin (anaphylaxis), Peanuts (moderate)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                You can also add granular allergy records with severity badges in the Allergies section.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Existing Medical Conditions
              </label>
              <textarea
                rows={2}
                {...register('existing_conditions')}
                placeholder="e.g. Mild Asthma, PCOS, Thyroid Condition"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Current Medications & Daily Regimen
              </label>
              <textarea
                rows={2}
                {...register('current_medications_summary')}
                placeholder="e.g. Albuterol Inhaler PRN, Levothyroxine 50mcg daily"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            className="px-6 font-semibold"
          >
            Save Health Profile
          </Button>
        </div>
      </form>
    </div>
  );
};
