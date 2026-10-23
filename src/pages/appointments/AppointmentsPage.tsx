import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Plus, Clock, MapPin, Video, Edit2, Trash2, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { Appointment, AppointmentStatus } from '../../types';
import { formatDate, formatTime } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

const appointmentSchema = z.object({
  doctor_name: z.string().min(2, 'Doctor name is required'),
  specialty: z.string().optional(),
  clinic_or_hospital: z.string().optional(),
  appointment_date: z.string().min(1, 'Date is required'),
  appointment_time: z.string().min(1, 'Time is required'),
  purpose: z.string().min(2, 'Purpose of visit is required'),
  location_address: z.string().optional(),
  telehealth_url: z.string().optional(),
  status: z.enum(['upcoming', 'completed', 'cancelled', 'rescheduled']),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Appointment | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00',
      status: 'upcoming',
    },
  });

  const loadAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dataService.getAppointments(user.id);
      setAppointments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const openAddModal = () => {
    setEditingItem(null);
    reset({
      doctor_name: '',
      specialty: 'Obstetrics & Gynecology (OB/GYN)',
      clinic_or_hospital: '',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00',
      purpose: '',
      location_address: '',
      telehealth_url: '',
      status: 'upcoming',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (item: Appointment) => {
    setEditingItem(item);
    reset({
      doctor_name: item.doctor_name,
      specialty: item.specialty || '',
      clinic_or_hospital: item.clinic_or_hospital || '',
      appointment_date: item.appointment_date,
      appointment_time: item.appointment_time,
      purpose: item.purpose,
      location_address: item.location_address || '',
      telehealth_url: item.telehealth_url || '',
      status: item.status,
      notes: item.notes || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!user) return;
    if (editingItem) {
      await dataService.updateAppointment(editingItem.id, data);
    } else {
      await dataService.addAppointment({
        user_id: user.id,
        ...data,
      });
    }
    setModalOpen(false);
    loadAppointments();
  };

  const handleCancelAppointment = async (id: string) => {
    if (confirm('Cancel this upcoming appointment?')) {
      await dataService.updateAppointment(id, { status: 'cancelled' });
      loadAppointments();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this appointment record?')) {
      await dataService.deleteAppointment(id);
      loadAppointments();
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'upcoming') return apt.status === 'upcoming';
    if (filter === 'completed') return apt.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Healthcare Appointments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track clinic visits, follow-up consults, and telehealth appointments
          </p>
        </div>

        <Button onClick={openAddModal} variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {(['upcoming', 'completed', 'all'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold capitalize transition-colors ${
              filter === tab
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointments Grid */}
      {filteredAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map(apt => (
            <Card key={apt.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={apt.status === 'upcoming' ? 'teal' : apt.status === 'completed' ? 'mint' : 'red'}>
                      {apt.status}
                    </Badge>
                    {apt.specialty && <span className="text-xs text-slate-500">{apt.specialty}</span>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(apt)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {apt.status === 'upcoming' && (
                      <button
                        onClick={() => handleCancelAppointment(apt.id)}
                        className="text-slate-400 hover:text-amber-600 p-1 rounded-lg hover:bg-amber-50"
                        title="Cancel appointment"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(apt.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{apt.doctor_name}</h3>
                <p className="text-xs font-semibold text-teal-700 mb-2">{apt.purpose}</p>

                <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-semibold text-slate-900">
                      {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}
                    </span>
                  </div>

                  {(apt.clinic_or_hospital || apt.location_address) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{apt.clinic_or_hospital || apt.location_address}</span>
                    </div>
                  )}

                  {apt.telehealth_url && (
                    <div className="flex items-center gap-2 text-teal-700 font-semibold">
                      <Video className="w-4 h-4 shrink-0" />
                      <a
                        href={apt.telehealth_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        Join Telehealth Room <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {apt.notes && (
                  <p className="text-xs text-slate-500 italic mb-2">
                    Notes: {apt.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Created: {formatDate(apt.created_at)}</span>
                {apt.status === 'upcoming' && (
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      dataService.updateAppointment(apt.id, { status: 'completed' });
                      loadAppointments();
                    }}
                    className="text-xs py-1 px-2.5 h-auto"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Mark Completed</span>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-slate-400 text-xs">
          No appointments found. Click "New Appointment" to schedule an upcoming visit.
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Appointment' : 'Schedule New Appointment'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Doctor or Clinician Name *
              </label>
              <input
                type="text"
                {...register('doctor_name')}
                placeholder="e.g. Dr. Sarah Jenkins"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
              {errors.doctor_name && <p className="text-xs text-red-500 mt-1">{errors.doctor_name.message}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Medical Specialty
              </label>
              <input
                type="text"
                {...register('specialty')}
                placeholder="e.g. Obstetrics & Gynecology, Endocrinology"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Appointment Date *
              </label>
              <input
                type="date"
                {...register('appointment_date')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Appointment Time *
              </label>
              <input
                type="time"
                {...register('appointment_time')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Purpose of Visit *
            </label>
            <input
              type="text"
              {...register('purpose')}
              placeholder="e.g. Annual well-woman exam, PCOS lab follow-up"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
            {errors.purpose && <p className="text-xs text-red-500 mt-1">{errors.purpose.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Clinic, Hospital or Location Address
              </label>
              <input
                type="text"
                {...register('location_address')}
                placeholder="e.g. 1101 Madison St, Suite 400"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Telehealth Video Call URL (If Virtual)
              </label>
              <input
                type="url"
                {...register('telehealth_url')}
                placeholder="https://telehealth.provider.com/room..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 capitalize font-medium"
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Preparation Notes
              </label>
              <input
                type="text"
                {...register('notes')}
                placeholder="e.g. Fast 8 hours prior for blood draw"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Appointment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
