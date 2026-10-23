import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, QrCode, Share2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { LocationShareModal } from '../emergency/LocationShareModal';

export const EmergencyBanner: React.FC = () => {
  const [showLocationShare, setShowLocationShare] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-red-500/10 mb-6 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md shrink-0">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight">EMERGENCY ASSISTANCE</span>
                <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  24/7 Rapid Action
                </span>
              </div>
              <p className="text-white/90 text-xs sm:text-sm mt-0.5 max-w-xl">
                If you are in immediate danger or facing a medical crisis, call local emergency services or share your digital emergency health card with first responders.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="tel:911"
              className="inline-flex items-center gap-2 bg-white text-red-600 font-bold px-4 py-2 rounded-xl text-sm shadow-md hover:bg-red-50 active:scale-95 transition-all"
            >
              <PhoneCall className="w-4 h-4 fill-current" />
              <span>Call 911 / 112</span>
            </a>

            <Link to="/emergency-card">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-medium"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Emergency</span> Card
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLocationShare(true)}
              className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-medium"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Location</span>
            </Button>
          </div>
        </div>
      </div>

      <LocationShareModal
        isOpen={showLocationShare}
        onClose={() => setShowLocationShare(false)}
      />
    </>
  );
};
