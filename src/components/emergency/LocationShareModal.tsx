import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MapPin, ShieldAlert, Copy, Check, StopCircle, Share2, ExternalLink } from 'lucide-react';

interface LocationShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationShareModal: React.FC<LocationShareModalProps> = ({ isOpen, onClose }) => {
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLiveSharing, setIsLiveSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveSharing(false);
  };

  const startSharing = () => {
    setErrorMsg(null);
    setIsLocating(true);

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    // Single grab + active watch
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setIsLocating(false);
        setIsLiveSharing(true);

        // Keep active watch until stopped
        watchIdRef.current = navigator.geolocation.watchPosition(
          updatePos => {
            setCoords({
              lat: updatePos.coords.latitude,
              lng: updatePos.coords.longitude,
              accuracy: Math.round(updatePos.coords.accuracy),
            });
          },
          err => {
            console.warn('Watch location error:', err);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
      },
      err => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg('Location permission was denied. Please allow location access in your browser settings.');
        } else {
          setErrorMsg('Could not detect location: ' + err.message);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!isOpen) {
      stopSharing();
    }
    return () => {
      stopSharing();
    };
  }, [isOpen]);

  const mapsUrl = coords
    ? `https://maps.google.com/?q=${coords.lat},${coords.lng}`
    : '';

  const shareText = coords
    ? `[HERCARE EMERGENCY LOCATION ALERT]\nI am sharing my current GPS location: https://maps.google.com/?q=${coords.lat},${coords.lng} (Accuracy: within ${coords.accuracy}m). Please check on me.`
    : '';

  const handleCopy = () => {
    if (!shareText) return;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share && coords) {
      try {
        await navigator.share({
          title: 'HerCare Emergency Location Alert',
          text: shareText,
          url: mapsUrl,
        });
      } catch (e) {
        console.warn('Share cancelled or failed', e);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Consent-Based Emergency Location Sharing"
      description="Share your real-time GPS coordinates directly with emergency contacts or first responders."
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        {/* Transparency note */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">Your Privacy & Security: </span>
            HerCare does NOT continuously track your location or store location trails on any server. Location is accessed solely in-browser with your explicit consent and stops instantly when you click "Stop Sharing".
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">
            {errorMsg}
          </div>
        )}

        {!isLiveSharing ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              Ready to Share Your Current Coordinates
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              Clicking the button below will ask your browser for device GPS coordinates to create an instant location link for your emergency contacts.
            </p>
            <Button
              onClick={startSharing}
              isLoading={isLocating}
              className="w-full sm:w-auto"
            >
              <MapPin className="w-4 h-4" />
              <span>Request Location & Share</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-emerald-800">Active Location Tracking</div>
                  <div className="text-[11px] text-emerald-700">
                    GPS: {coords?.lat.toFixed(5)}, {coords?.lng.toFixed(5)} (±{coords?.accuracy}m)
                  </div>
                </div>
              </div>

              <Button
                variant="danger"
                size="sm"
                onClick={stopSharing}
                className="shrink-0"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop Sharing</span>
              </Button>
            </div>

            {/* Preview what will be shared */}
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                Emergency Location Message Preview:
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono break-all select-all">
                {shareText}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="w-full"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Emergency Text'}</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleNativeShare}
                className="w-full"
              >
                <Share2 className="w-4 h-4" />
                <span>Send to Contacts</span>
              </Button>
            </div>

            <div className="text-center pt-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                <span>Preview on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
