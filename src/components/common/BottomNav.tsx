import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, AlertCircle, Bot, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 lg:hidden shadow-lg">
      <div className="flex items-center justify-around relative">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors',
              isActive ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        {/* Records */}
        <NavLink
          to="/records"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors',
              isActive ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'
            )
          }
        >
          <FileText className="w-5 h-5" />
          <span>Records</span>
        </NavLink>

        {/* Center Emergency SOS Button */}
        <NavLink
          to="/emergency-card"
          className="flex flex-col items-center -top-4 relative group"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 p-3 text-white shadow-lg shadow-red-500/40 group-active:scale-95 transition-transform flex items-center justify-center">
            <AlertCircle className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold text-red-600 mt-1">SOS</span>
        </NavLink>

        {/* AI Assistant */}
        <NavLink
          to="/ai-assistant"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors',
              isActive ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'
            )
          }
        >
          <Bot className="w-5 h-5" />
          <span>AI Health</span>
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors',
              isActive ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'
            )
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};
