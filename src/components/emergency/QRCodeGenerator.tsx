import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Download, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';
import { Button } from '../common/Button';
import { formatDate, getEmergencyCardUrl } from '../../lib/utils';

interface QRCodeGeneratorProps {
  plainToken: string;
  expiresAt: string;
  isRevoked: boolean;
  onRevoke?: () => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  plainToken,
  expiresAt,
  isRevoked,
  onRevoke,
}) => {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Compute canonical public emergency viewer URL (uses VITE_APP_URL in production)
  const emergencyUrl = getEmergencyCardUrl(plainToken);

  const handleCopy = () => {
    navigator.clipboard.writeText(emergencyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        // Draw white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 50, 50, 500, 500);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `hercare-emergency-qr-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (isRevoked) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-red-900 mb-1">Emergency Token Revoked</h3>
        <p className="text-xs text-red-700 leading-relaxed">
          This QR access token was permanently revoked. Scanning or opening this link will immediately return an unauthorized revoked status.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft max-w-md mx-auto text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-700 mb-3 uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4" />
        <span>Opaque Cryptographic Bearer QR</span>
      </div>

      {/* QR Code Container */}
      <div
        ref={qrRef}
        className="p-4 bg-white border-2 border-dashed border-teal-200 rounded-2xl inline-block shadow-inner mb-4"
      >
        <QRCodeSVG
          value={emergencyUrl}
          size={200}
          level="H" // High error correction level for easy camera scanning
          includeMargin={true}
          imageSettings={{
            src: '/vite.svg',
            x: undefined,
            y: undefined,
            height: 32,
            width: 32,
            excavate: true,
          }}
        />
      </div>

      <div className="text-xs text-slate-500 mb-4 space-y-1">
        <div>
          <span className="font-medium text-slate-700">Token Expiration: </span>
          <span className="text-teal-700 font-semibold">{formatDate(expiresAt)}</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Anyone possessing this active link can view your user-approved emergency card fields.
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="w-full text-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadQR}
            className="w-full text-xs"
          >
            <Download className="w-4 h-4" />
            <span>Save PNG</span>
          </Button>
        </div>

        <a
          href={emergencyUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 py-1.5 hover:underline"
        >
          <span>Open Emergency Viewer in New Tab</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {onRevoke && (
          <Button
            variant="danger"
            size="sm"
            onClick={onRevoke}
            className="w-full mt-2 text-xs"
          >
            Revoke Access Immediately
          </Button>
        )}
      </div>
    </div>
  );
};
