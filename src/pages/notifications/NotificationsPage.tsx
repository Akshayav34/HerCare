import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ShieldAlert, Pill, Calendar, Info, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'emergency_access':
        return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case 'medication_due':
        return <Pill className="w-5 h-5 text-teal-600" />;
      case 'appointment_reminder':
        return <Calendar className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Notifications & Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="bg-teal-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time medication alerts, emergency QR access logs, and clinical reminders
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map(notif => (
            <Card
              key={notif.id}
              className={`p-4 transition-all ${
                !notif.is_read
                  ? 'border-teal-300 bg-teal-50/20 shadow-sm'
                  : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {notif.title}
                      </h3>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-teal-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>{formatDate(notif.created_at)}</span>
                      {notif.action_url && (
                        <Link
                          to={notif.action_url}
                          className="text-teal-700 font-semibold hover:underline"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!notif.is_read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="text-slate-400 hover:text-teal-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-slate-400 text-xs">
          No notifications at this time.
        </Card>
      )}
    </div>
  );
};
