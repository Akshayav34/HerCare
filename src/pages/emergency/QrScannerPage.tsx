import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, Camera, Upload, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { DEMO_SAMPLE_PLAIN_TOKEN } from '../../services/mockData';

export const QrScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [manualToken, setManualToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'qr-reader-container';

  const handleScanSuccess = (decodedText: string) => {
    // If text is a full URL e.g. https://domain.com/emergency/token123
    let token = decodedText.trim();
    if (token.includes('/emergency/')) {
      const parts = token.split('/emergency/');
      token = parts[parts.length - 1];
    }
    stopScanner();
    navigate(`/emergency/${token}`);
  };

  const startScanner = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Rear camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        decodedText => {
          handleScanSuccess(decodedText);
        },
        _error => {
          // scanning frame loop error, ignore
        }
      );
    } catch (err: any) {
      console.warn('Camera scan initialization failed:', err);
      setCameraError(
        'Unable to access camera. Please allow camera permissions or enter the emergency token below.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
        scannerRef.current = null;
      }).catch(console.warn);
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const html5QrCode = new Html5Qrcode('file-scanner-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err: any) {
      setCameraError('No valid QR code was detected in the uploaded image file.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    let token = manualToken.trim();
    if (token.includes('/emergency/')) {
      const parts = token.split('/emergency/');
      token = parts[parts.length - 1];
    }
    navigate(`/emergency/${token}`);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-teal-600/20">
          <ScanLine className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Emergency QR Code Scanner
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Scan a patient's physical QR card, lock screen, or bracelet to immediately view authorized emergency vitals
        </p>
      </div>

      {cameraError && (
        <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl p-4 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Camera Live View Box */}
      <Card className="p-6 text-center space-y-4">
        <div
          id={readerElementId}
          className={`w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 ${
            isScanning ? 'border-teal-500' : 'border-dashed border-slate-200 min-h-[220px]'
          } flex items-center justify-center bg-slate-50`}
        >
          {!isScanning && (
            <div className="py-8 text-center text-slate-400">
              <Camera className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Camera stream will appear here</p>
            </div>
          )}
        </div>

        <div id="file-scanner-temp" className="hidden" />

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {!isScanning ? (
            <Button variant="primary" size="md" onClick={startScanner}>
              <Camera className="w-4 h-4" />
              <span>Start Camera Scanner</span>
            </Button>
          ) : (
            <Button variant="danger" size="md" onClick={stopScanner}>
              <span>Stop Camera</span>
            </Button>
          )}

          <label className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Scan QR Image File</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </Card>

      {/* Manual Input or Quick Demo Test */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Manual Token or URL Input
        </h3>

        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Bearer Token or Full Emergency URL
            </label>
            <input
              type="text"
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              placeholder="e.g. demo-emergency-token-hercare-2026 or paste URL"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setManualToken(DEMO_SAMPLE_PLAIN_TOKEN)}
              className="text-xs text-teal-700 hover:underline font-semibold"
            >
              Insert Demo Sample Token
            </button>

            <Button type="submit" variant="primary" size="sm">
              <span>View Emergency Card</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
