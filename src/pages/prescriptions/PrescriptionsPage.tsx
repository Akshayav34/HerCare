import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileCheck2, Plus, Calendar, User, Building, Trash2, Pill, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { Prescription } from '../../types';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

const prescriptionSchema = z.object({
  prescribing_doctor: z.string().min(2, 'Doctor name is required'),
  clinic_or_hospital: z.string().optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  expiry_date: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

export const PrescriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      issue_date: new Date().toISOString().split('T')[0],
      is_active: true,
    },
  });

  const loadPrescriptions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dataService.getPrescriptions(user.id);
      setPrescriptions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [user]);

  const onSubmit = async (data: PrescriptionFormData) => {
    if (!user) return;
    await dataService.addPrescription({
      user_id: user.id,
      ...data,
    });
    setModalOpen(false);
    reset();
    loadPrescriptions();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this prescription record?')) {
      await dataService.deletePrescription(id);
      loadPrescriptions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Prescriptions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize official clinical prescriptions, refills, and prescribing physician details
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          <span>Add Prescription</span>
        </Button>
      </div>

      {prescriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prescriptions.map(rx => (
            <Card key={rx.id} hoverEffect className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={rx.is_active ? 'teal' : 'slate'}>
                    {rx.is_active ? 'Active Rx' : 'Expired / Completed'}
                  </Badge>
                  <button
                    onClick={() => handleDelete(rx.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">
                  {rx.prescribing_doctor}
                </h3>
                <p className="text-xs text-slate-500 mb-2">{rx.clinic_or_hospital}</p>

                {rx.diagnosis && (
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs mb-3">
                    <span className="font-semibold text-slate-700">Diagnosis: </span>
                    <span className="text-slate-600">{rx.diagnosis}</span>
                  </div>
                )}

                {rx.notes && (
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {rx.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Issued: {formatDate(rx.issue_date)}</span>
                {rx.expiry_date && <span>Expires: {formatDate(rx.expiry_date)}</span>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-slate-400 text-xs">
          No prescriptions saved yet. Click "Add Prescription" to log your doctor's prescriptions.
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Prescription Record"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Prescribing Doctor *
            </label>
            <input
              type="text"
              {...register('prescribing_doctor')}
              placeholder="e.g. Dr. Sarah Jenkins, FACOG"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
            {errors.prescribing_doctor && (
              <p className="text-xs text-red-500 mt-1">{errors.prescribing_doctor.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Clinic or Hospital
            </label>
            <input
              type="text"
              {...register('clinic_or_hospital')}
              placeholder="e.g. Swedish Women's Health Pavilion"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                {...register('issue_date')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Expiry / Refill Due Date
              </label>
              <input
                type="date"
                {...register('expiry_date')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Primary Diagnosis / Indication
            </label>
            <input
              type="text"
              {...register('diagnosis')}
              placeholder="e.g. PCOS & Mild Anemia"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Prescription Instructions / Special Notes
            </label>
            <textarea
              rows={2}
              {...register('notes')}
              placeholder="Refills authorized, take with food..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Prescription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
