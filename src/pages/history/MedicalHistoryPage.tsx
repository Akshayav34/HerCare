import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { History, Plus, Edit2, Trash2, Calendar, User, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { MedicalHistoryItem, HistoryCategory } from '../../types';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

const historySchema = z.object({
  category: z.enum(['surgery', 'chronic_condition', 'family_history', 'reproductive_health', 'vaccination', 'other']),
  title: z.string().min(2, 'Title is required'),
  diagnosis_date: z.string().optional(),
  description: z.string().optional(),
  treatment: z.string().optional(),
  physician_name: z.string().optional(),
  is_active: z.boolean().default(true),
});

type HistoryFormData = z.infer<typeof historySchema>;

export const MedicalHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MedicalHistoryItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicalHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HistoryFormData>({
    resolver: zodResolver(historySchema),
    defaultValues: {
      category: 'chronic_condition',
      is_active: true,
    },
  });

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dataService.getHistory(user.id);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const openAddModal = () => {
    setEditingItem(null);
    reset({
      category: 'chronic_condition',
      title: '',
      diagnosis_date: '',
      description: '',
      treatment: '',
      physician_name: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: MedicalHistoryItem) => {
    setEditingItem(item);
    reset({
      category: item.category,
      title: item.title,
      diagnosis_date: item.diagnosis_date || '',
      description: item.description || '',
      treatment: item.treatment || '',
      physician_name: item.physician_name || '',
      is_active: item.is_active,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: HistoryFormData) => {
    if (!user) return;
    if (editingItem) {
      await dataService.updateHistory(editingItem.id, data);
    } else {
      await dataService.addHistory({
        user_id: user.id,
        ...data,
      });
    }
    setModalOpen(false);
    loadHistory();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this medical history entry?')) {
      await dataService.deleteHistory(id);
      loadHistory();
    }
  };

  const filteredItems = items.filter(
    item => filter === 'all' || item.category === filter
  );

  const getCategoryBadgeVariant = (cat: HistoryCategory) => {
    switch (cat) {
      case 'chronic_condition':
        return 'teal';
      case 'reproductive_health':
        return 'pink';
      case 'surgery':
        return 'amber';
      case 'vaccination':
        return 'mint';
      default:
        return 'slate';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Medical History & Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track surgeries, reproductive health milestones, chronic conditions, and immunizations
          </p>
        </div>

        <Button onClick={openAddModal} variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          <span>Add History Entry</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        {['all', 'chronic_condition', 'reproductive_health', 'surgery', 'vaccination', 'family_history'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold capitalize whitespace-nowrap transition-colors ${
              filter === cat
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* History Items List */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={getCategoryBadgeVariant(item.category)} className="capitalize">
                    {item.category.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.is_active ? 'Active' : 'Resolved'}
                    </span>
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">{item.title}</h3>

                {item.description && (
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {item.treatment && (
                  <div className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-xl mb-3">
                    <span className="font-semibold text-slate-700">Treatment Plan: </span>
                    <span className="text-slate-600">{item.treatment}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(item.diagnosis_date)}
                </span>
                {item.physician_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {item.physician_name}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-slate-400 text-xs">
          No medical history records found under this filter. Click "Add History Entry" to record your history.
        </Card>
      )}

      {/* Modal for Add / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Medical History' : 'Add Medical History Entry'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Category *
              </label>
              <select
                {...register('category')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-semibold"
              >
                <option value="chronic_condition">Chronic Condition</option>
                <option value="reproductive_health">Reproductive Health</option>
                <option value="surgery">Surgery / Procedure</option>
                <option value="vaccination">Vaccination / Immunization</option>
                <option value="family_history">Family Medical History</option>
                <option value="other">Other Clinical Event</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Diagnosis or Procedure Date
              </label>
              <input
                type="date"
                {...register('diagnosis_date')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Title or Condition Name *
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Polycystic Ovary Syndrome (PCOS)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Clinical Description & Notes
            </label>
            <textarea
              rows={2}
              {...register('description')}
              placeholder="Symptoms, pathology, or diagnosis findings..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Treatment, Medication or Surgery Notes
            </label>
            <input
              type="text"
              {...register('treatment')}
              placeholder="e.g. Lifestyle modification, daily medication"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Treating Physician or Facility
            </label>
            <input
              type="text"
              {...register('physician_name')}
              placeholder="e.g. Dr. Sarah Jenkins, OB/GYN"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="is_active" className="text-xs text-slate-700 font-medium">
              This condition or procedure outcome is currently active / ongoing
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save History
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
