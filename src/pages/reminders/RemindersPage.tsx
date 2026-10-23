import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BellRing, Plus, Clock, CheckCircle2, Bell, AlertCircle, Trash2, Volume2, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { dataService } from '../../services/dataService';
import { Reminder, ReminderType } from '../../types';
import { formatTime } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

const reminderSchema = z.object({
  title: z.string().min(2, 'Reminder title is required'),
  reminder_type: z.enum(['medication', 'appointment', 'measurement', 'follow_up', 'other']),
  scheduled_time: z.string().min(1, 'Time is required (HH:mm)'),
  notes: z.string().optional(),
  is_enabled: z.boolean().default(true),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

export const RemindersPage: React.FC = () => {
  const { user } = useAuth();
  const { browserPermission, requestBrowserPermission, sendLocalNotification } = useNotifications();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      reminder_type: 'medication',
      scheduled_time: '08:00',
      is_enabled: true,
    },
  });

  const loadReminders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dataService.getReminders(user.id);
      setReminders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, [user]);

  const onSubmit = async (data: ReminderFormData) => {
    if (!user) return;
    await dataService.addReminder({
      user_id: user.id,
      days_of_week: [0, 1, 2, 3, 4, 5, 6],
      ...data,
    });
    setModalOpen(false);
    reset();
    loadReminders();
  };

  const handleMarkCompleted = async (id: string, title: string) => {
    await dataService.updateReminder(id, {
      last_completed_at: new Date().toISOString(),
    });
    sendLocalNotification('Dose Completed', `You marked "${title}" as completed for today.`, 'medication_due');
    loadReminders();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this reminder?')) {
      await dataService.deleteReminder(id);
      loadReminders();
    }
  };

  const handleTestAlert = () => {
    sendLocalNotification(
      'Test Medication Alert',
      'This is how HerCare delivers your scheduled medication reminders to your browser!',
      'medication_due'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Medication & Follow-Up Reminders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Stay on track with daily dose alerts, cycle logs, and clinic follow-up notifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleTestAlert} variant="outline" size="sm">
            <Volume2 className="w-4 h-4 text-teal-600" />
            <span>Test Alert</span>
          </Button>

          <Button onClick={() => setModalOpen(true)} variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </Button>
        </div>
      </div>

      {/* Browser Notification Permission Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">
              Browser Notification Status:{' '}
              <span className={`capitalize ${browserPermission === 'granted' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {browserPermission}
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              In-app reminders run whenever this tab is active. Grant browser permission to receive desktop alerts.
            </p>
          </div>
        </div>

        {browserPermission !== 'granted' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={requestBrowserPermission}
            className="shrink-0 text-xs font-semibold"
          >
            Enable Desktop Alerts
          </Button>
        )}
      </div>

      {/* Reminders List */}
      {reminders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reminders.map(rem => {
            const isCompletedToday =
              rem.last_completed_at &&
              new Date(rem.last_completed_at).toDateString() === new Date().toDateString();

            return (
              <Card key={rem.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="teal" className="capitalize">
                      {rem.reminder_type}
                    </Badge>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(rem.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">{rem.title}</h3>

                  <div className="flex items-center gap-1.5 text-xs text-teal-700 font-bold mb-2">
                    <Clock className="w-4 h-4" />
                    <span>Daily at {formatTime(rem.scheduled_time)}</span>
                  </div>

                  {rem.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                      {rem.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {isCompletedToday ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Taken today
                      </span>
                    ) : (
                      'Pending today'
                    )}
                  </span>

                  <Button
                    size="sm"
                    variant={isCompletedToday ? 'outline' : 'primary'}
                    disabled={Boolean(isCompletedToday)}
                    onClick={() => handleMarkCompleted(rem.id, rem.title)}
                    className="text-xs"
                  >
                    {isCompletedToday ? 'Completed' : 'Mark as Taken'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center text-slate-400 text-xs">
          No reminders configured yet. Click "Add Reminder" to schedule daily alerts.
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule New Reminder"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Reminder Title *
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Morning Levothyroxine 50mcg"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Type
              </label>
              <select
                {...register('reminder_type')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 capitalize font-medium"
              >
                <option value="medication">Medication Dose</option>
                <option value="appointment">Appointment</option>
                <option value="measurement">Blood Pressure / Vitals</option>
                <option value="follow_up">Weekly Follow-Up</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Daily Scheduled Time *
              </label>
              <input
                type="time"
                {...register('scheduled_time')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Reminder Instructions / Notes
            </label>
            <input
              type="text"
              {...register('notes')}
              placeholder="e.g. Take 45 mins before breakfast with water"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Reminder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
