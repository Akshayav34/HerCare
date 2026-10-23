import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PhoneCall, Plus, Star, Edit2, Trash2, Share2, Mail, ShieldAlert, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { EmergencyContact } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LocationShareModal } from '../../components/emergency/LocationShareModal';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  relationship: z.string().min(2, 'Relationship is required (e.g. Partner, Parent, Sibling)'),
  phone_number: z.string().min(7, 'Valid phone number is required'),
  secondary_phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  is_primary: z.boolean().default(false),
  priority_order: z.number().default(1),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const EmergencyContactsPage: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EmergencyContact | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      is_primary: false,
      priority_order: 1,
    },
  });

  const loadContacts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dataService.getContacts(user.id);
      setContacts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [user]);

  const openAddModal = () => {
    setEditingItem(null);
    reset({
      name: '',
      relationship: '',
      phone_number: '',
      secondary_phone: '',
      email: '',
      is_primary: contacts.length === 0,
      priority_order: contacts.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: EmergencyContact) => {
    setEditingItem(item);
    reset({
      name: item.name,
      relationship: item.relationship,
      phone_number: item.phone_number,
      secondary_phone: item.secondary_phone || '',
      email: item.email || '',
      is_primary: item.is_primary,
      priority_order: item.priority_order,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: ContactFormData) => {
    if (!user) return;
    if (editingItem) {
      await dataService.updateContact(editingItem.id, data);
    } else {
      await dataService.addContact({
        user_id: user.id,
        ...data,
      });
    }
    setModalOpen(false);
    loadContacts();
  };

  const handleSetPrimary = async (id: string) => {
    for (const c of contacts) {
      await dataService.updateContact(c.id, { is_primary: c.id === id });
    }
    loadContacts();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this emergency contact?')) {
      await dataService.deleteContact(id);
      loadContacts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Emergency Contacts & SOS
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Designate primary trusted contacts who can be reached instantly during an emergency
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocationModalOpen(true)}
            className="text-teal-700"
          >
            <Share2 className="w-4 h-4" />
            <span>Share GPS Location</span>
          </Button>

          <Button onClick={openAddModal} variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </Button>
        </div>
      </div>

      {/* Contacts List Grid */}
      {contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(c => (
            <Card
              key={c.id}
              className={`p-5 flex flex-col justify-between ${
                c.is_primary
                  ? 'border-2 border-teal-600 bg-teal-50/20 shadow-md'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  {c.is_primary ? (
                    <span className="bg-teal-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Primary Contact
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetPrimary(c.id)}
                      className="text-xs text-slate-400 hover:text-teal-600 font-semibold"
                    >
                      Make Primary
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                <span className="text-xs font-semibold text-teal-700 block mb-3">
                  {c.relationship}
                </span>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-900">{c.phone_number}</span>
                  </div>

                  {c.secondary_phone && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Alt: {c.secondary_phone}</span>
                    </div>
                  )}

                  {c.email && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`tel:${c.phone_number}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-xs shadow-sm transition-all active:scale-95"
                >
                  <PhoneCall className="w-4 h-4 fill-current" />
                  <span>Call {c.name.split(' ')[0]}</span>
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-slate-400 text-xs">
          No emergency contacts added yet. Click "Add Contact" to configure your emergency support network.
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Contact Name *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. David Lin"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Relationship to You *
            </label>
            <input
              type="text"
              {...register('relationship')}
              placeholder="e.g. Brother, Partner, Mother, Treating Physician"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
            {errors.relationship && <p className="text-xs text-red-500 mt-1">{errors.relationship.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Primary Phone *
              </label>
              <input
                type="tel"
                {...register('phone_number')}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
              {errors.phone_number && <p className="text-xs text-red-500 mt-1">{errors.phone_number.message}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Secondary Phone
              </label>
              <input
                type="tel"
                {...register('secondary_phone')}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="contact@example.com"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_primary_checkbox"
              {...register('is_primary')}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="is_primary_checkbox" className="text-xs text-slate-700 font-medium">
              Set as primary emergency contact on my Emergency Health Card
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>

      <LocationShareModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
    </div>
  );
};
