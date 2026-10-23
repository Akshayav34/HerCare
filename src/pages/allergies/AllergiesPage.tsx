import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertOctagon, Plus, Edit2, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { AllergyItem, AllergyCategory, AllergySeverity } from '../../types';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

const allergySchema = z.object({
  allergen: z.string().min(2, 'Allergen name is required'),
  category: z.enum(['medication', 'food', 'environmental', 'latex', 'insect', 'other']),
  severity: z.enum(['mild', 'moderate', 'severe', 'anaphylactic']),
  reaction: z.string().optional(),
  diagnosed_date: z.string().optional(),
  notes: z.string().optional(),
});

type AllergyFormData = z.infer<typeof allergySchema>;

export const AllergiesPage: React.FC = () => {
  const { user } = useAuth();
  const [allergies, setAllergies] = useState<AllergyItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AllergyItem | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AllergyFormData>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      category: 'medication',
      severity: 'moderate',
    },
  });

  const loadAllergies = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dataService.getAllergies(user.id);
      setAllergies(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllergies();
  }, [user]);

  const openAddModal = () => {
    setEditingItem(null);
    reset({
      allergen: '',
      category: 'medication',
      severity: 'moderate',
      reaction: '',
      diagnosed_date: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (item: AllergyItem) => {
    setEditingItem(item);
    reset({
      allergen: item.allergen,
      category: item.category,
      severity: item.severity,
      reaction: item.reaction || '',
      diagnosed_date: item.diagnosed_date || '',
      notes: item.notes || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: AllergyFormData) => {
    if (!user) return;
    if (editingItem) {
      await dataService.updateAllergy(editingItem.id, data);
    } else {
      await dataService.addAllergy({
        user_id: user.id,
        ...data,
      });
    }
    setModalOpen(false);
    loadAllergies();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this allergy record?')) {
      await dataService.deleteAllergy(id);
      loadAllergies();
    }
  };

  const getSeverityBadgeVariant = (severity: AllergySeverity) => {
    switch (severity) {
      case 'anaphylactic':
        return 'red';
      case 'severe':
        return 'pink';
      case 'moderate':
        return 'amber';
      case 'mild':
        return 'teal';
      default:
        return 'slate';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Allergies & Sensitivities
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain critical allergy alerts to protect against contraindications and adverse reactions
          </p>
        </div>

        <Button onClick={openAddModal} variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          <span>Add Allergy</span>
        </Button>
      </div>

      {/* Allergies Grid */}
      {allergies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allergies.map(alg => (
            <Card
              key={alg.id}
              className={`p-5 flex flex-col justify-between ${
                alg.severity === 'anaphylactic'
                  ? 'border-red-300 bg-red-50/20 shadow-sm'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={getSeverityBadgeVariant(alg.severity)} className="uppercase font-bold tracking-wider text-[10px]">
                    {alg.severity}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(alg)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(alg.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">{alg.allergen}</h3>
                <span className="text-[11px] font-semibold text-slate-500 capitalize block mb-2">
                  Category: {alg.category}
                </span>

                {alg.reaction && (
                  <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs text-slate-700 mb-2">
                    <span className="font-semibold text-slate-900">Reaction: </span>
                    {alg.reaction}
                  </div>
                )}

                {alg.notes && (
                  <p className="text-[11px] text-slate-500 italic mb-3">
                    Note: {alg.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Diagnosed: {formatDate(alg.diagnosed_date)}</span>
                {alg.severity === 'anaphylactic' && (
                  <span className="text-red-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Critical Alert
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-slate-400 text-xs">
          No allergies recorded. Click "Add Allergy" to document your known medication, food, or environmental allergies.
        </Card>
      )}

      {/* Modal for Add / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Allergy Record' : 'Add New Allergy'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Allergen Name *
            </label>
            <input
              type="text"
              {...register('allergen')}
              placeholder="e.g. Penicillin, Peanuts, Latex"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
            {errors.allergen && <p className="text-xs text-red-500 mt-1">{errors.allergen.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Category *
              </label>
              <select
                {...register('category')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 capitalize font-medium"
              >
                <option value="medication">Medication / Drug</option>
                <option value="food">Food</option>
                <option value="latex">Latex</option>
                <option value="environmental">Environmental</option>
                <option value="insect">Insect Sting</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Severity Level *
              </label>
              <select
                {...register('severity')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 capitalize font-medium"
              >
                <option value="mild">Mild (Rash / Itching)</option>
                <option value="moderate">Moderate (Hives / Swelling)</option>
                <option value="severe">Severe (Wheezing / Distress)</option>
                <option value="anaphylactic">Anaphylactic (Shock / Airway Closure)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Reaction Symptoms
            </label>
            <input
              type="text"
              {...register('reaction')}
              placeholder="e.g. Bronchospasm, facial angioedema, hives"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Date Diagnosed or First Observed
            </label>
            <input
              type="date"
              {...register('diagnosed_date')}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Emergency Action Notes
            </label>
            <textarea
              rows={2}
              {...register('notes')}
              placeholder="e.g. Carry EpiPen auto-injector in handbag"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Allergy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
