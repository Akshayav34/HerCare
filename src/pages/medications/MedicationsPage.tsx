import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Pill, Plus, Edit2, Trash2, Calendar, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { Medication } from '../../types';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

const medicationSchema = z.object({
  name: z.string().min(2, 'Medication name is required'),
  dosage: z.string().min(1, 'User-entered dosage is required'),
  frequency: z.string().min(2, 'Frequency is required (e.g. Once daily, PRN)'),
  route: z.string().default('Oral'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  prescribing_doctor: z.string().optional(),
  purpose: z.string().optional(),
  instructions: z.string().optional(),
  is_active: z.boolean().default(true),
});

type MedicationFormData = z.infer<typeof medicationSchema>;

export const MedicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      route: 'Oral',
      start_date: new Date().toISOString().split('T')[0],
      is_active: true,
    },
  });

  const loadMedications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dataService.getMedications(user.id);
      setMedications(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, [user]);

  const openAddModal = () => {
    setEditingItem(null);
    reset({
      name: '',
      dosage: '',
      frequency: 'Once daily',
      route: 'Oral',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      prescribing_doctor: '',
      purpose: '',
      instructions: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: Medication) => {
    setEditingItem(item);
    reset({
      name: item.name,
      dosage: item.dosage,
      frequency: item.frequency,
      route: item.route || 'Oral',
      start_date: item.start_date,
      end_date: item.end_date || '',
      prescribing_doctor: item.prescribing_doctor || '',
      purpose: item.purpose || '',
      instructions: item.instructions || '',
      is_active: item.is_active,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: MedicationFormData) => {
    if (!user) return;
    if (editingItem) {
      await dataService.updateMedication(editingItem.id, data);
    } else {
      await dataService.addMedication({
        user_id: user.id,
        ...data,
      });
    }
    setModalOpen(false);
    loadMedications();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this medication from your regimen?')) {
      await dataService.deleteMedication(id);
      loadMedications();
    }
  };

  const activeMeds = medications.filter(m => m.is_active);
  const inactiveMeds = medications.filter(m => !m.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Medication Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track user-recorded prescriptions, dosages, administration routes, and safety instructions
          </p>
        </div>

        <Button onClick={openAddModal} variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </Button>
      </div>

      {/* Safety Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">Patient-Entered Records: </span>
          HerCare does NOT automatically generate prescriptions or recommend dosages. Always follow the explicit instructions provided on your prescription packaging by your licensed physician or pharmacist.
        </div>
      </div>

      {/* Active Medications */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span>Active Medications ({activeMeds.length})</span>
        </h2>

        {activeMeds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeMeds.map(med => (
              <Card key={med.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="teal">{med.route}</Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(med)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(med.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{med.name}</h3>
                  <div className="text-xs font-semibold text-teal-700 mt-0.5 mb-2">
                    Dosage: {med.dosage} • {med.frequency}
                  </div>

                  {med.purpose && (
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-xs text-slate-700 mb-2">
                      <span className="font-medium text-slate-500">Purpose: </span>
                      {med.purpose}
                    </div>
                  )}

                  {med.instructions && (
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      <strong>Instructions: </strong> {med.instructions}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Started: {formatDate(med.start_date)}</span>
                  {med.prescribing_doctor && <span>Dr. {med.prescribing_doctor}</span>}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-slate-400 text-xs">
            No active medications recorded.
          </Card>
        )}
      </div>

      {/* Discontinued / Past Medications */}
      {inactiveMeds.length > 0 && (
        <div className="pt-4">
          <h2 className="text-sm font-bold text-slate-500 mb-3">
            Past or Completed Medications ({inactiveMeds.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
            {inactiveMeds.map(med => (
              <Card key={med.id} className="p-4 bg-slate-50">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 text-sm">{med.name}</span>
                  <Badge variant="slate">Discontinued</Badge>
                </div>
                <p className="text-xs text-slate-500">{med.dosage} • {med.frequency}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Medication' : 'Add Medication to Regimen'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Medication Brand or Generic Name *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Levothyroxine Sodium"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Prescribed Dosage (User-Entered) *
              </label>
              <input
                type="text"
                {...register('dosage')}
                placeholder="e.g. 50 mcg, 2 puffs, 500 mg"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
              {errors.dosage && <p className="text-xs text-red-500 mt-1">{errors.dosage.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Frequency *
              </label>
              <input
                type="text"
                {...register('frequency')}
                placeholder="e.g. Once daily in morning, Every 8 hours"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Administration Route
              </label>
              <select
                {...register('route')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="Oral">Oral (Tablet, Capsule, Liquid)</option>
                <option value="Inhalation">Inhalation (Inhaler, Nebulizer)</option>
                <option value="Topical">Topical (Cream, Patch)</option>
                <option value="Subcutaneous">Subcutaneous Injection</option>
                <option value="Intramuscular">Intramuscular Injection</option>
                <option value="Sublingual">Sublingual (Under tongue)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Start Date *
              </label>
              <input
                type="date"
                {...register('start_date')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                {...register('end_date')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Prescribing Physician
              </label>
              <input
                type="text"
                {...register('prescribing_doctor')}
                placeholder="e.g. Dr. Anita Patel"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Clinical Purpose / Condition
              </label>
              <input
                type="text"
                {...register('purpose')}
                placeholder="e.g. Thyroid hormone regulation"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Instructions (e.g. Take with full glass of water 45 mins before breakfast)
            </label>
            <textarea
              rows={2}
              {...register('instructions')}
              placeholder="Enter special instructions as given on prescription label"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="med_is_active"
              {...register('is_active')}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="med_is_active" className="text-xs text-slate-700 font-medium">
              Currently taking this medication (Active regimen)
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Medication
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
