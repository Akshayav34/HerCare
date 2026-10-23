import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  History,
  AlertOctagon,
  FileText,
  UploadCloud,
  FileCheck2,
  Pill,
  Calendar,
  BellRing,
  Bot,
  MapPin,
  PhoneCall,
  QrCode,
  ScanLine,
  Bell,
  Settings,
  Shield,
  Heart,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { unreadCount } = useNotifications();
  const { logout, isDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Personal Profile', icon: User, path: '/profile' },
      ],
    },
    {
      title: 'Clinical Records',
      items: [
        { label: 'Medical History', icon: History, path: '/medical-history' },
        { label: 'Allergies', icon: AlertOctagon, path: '/allergies' },
        { label: 'Health Records', icon: FileText, path: '/records' },
        { label: 'Upload Reports', icon: UploadCloud, path: '/records/upload' },
        { label: 'Prescriptions', icon: FileCheck2, path: '/prescriptions' },
        { label: 'Medications', icon: Pill, path: '/medications' },
      ],
    },
    {
      title: 'Appointments & Care',
      items: [
        { label: 'Appointments', icon: Calendar, path: '/appointments' },
        { label: 'Medication Reminders', icon: BellRing, path: '/reminders' },
        { label: 'AI Assistant', icon: Bot, path: '/ai-assistant' },
        { label: 'Nearby Healthcare', icon: MapPin, path: '/nearby' },
      ],
    },
    {
      title: 'Emergency & Safety',
      items: [
        { label: 'Emergency Health Card', icon: QrCode, path: '/emergency-card' },
        { label: 'QR Scanner', icon: ScanLine, path: '/qr-scanner' },
        { label: 'Emergency Contacts', icon: PhoneCall, path: '/emergency-contacts' },
      ],
    },
    {
      title: 'System & Preferences',
      items: [
        {
          label: 'Notifications',
          icon: Bell,
          path: '/notifications',
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        { label: 'Privacy & Settings', icon: Settings, path: '/settings' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-30',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header in Drawer */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-teal-600 fill-rosepink-200" />
            <span className="font-extrabold text-slate-900">HerCare Navigation</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navSections.map(section => (
            <div key={section.title}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => onClose()}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group',
                          isActive
                            ? 'bg-teal-50 text-teal-800 shadow-sm border border-teal-100/80'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={cn(
                                'w-4 h-4 transition-colors',
                                isActive
                                  ? 'text-teal-600'
                                  : 'text-slate-400 group-hover:text-slate-600'
                              )}
                            />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Safety Shield Widget & Logout */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 m-3 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Emergency Ready</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Your QR token is active. In a medical crisis, emergency responders can view authorized health vitals.
          </p>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200/80 rounded-xl transition-colors shadow-2xs mt-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Switch Account</span>
          </button>
        </div>
      </aside>
    </>
  );
};
