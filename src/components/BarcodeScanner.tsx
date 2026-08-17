import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const READER_ID = 'skintel-barcode-reader';

/**
 * Camera barcode scanner. Works on Android Chrome and iOS Safari — the camera
 * needs a secure context, so it runs on https:// or localhost only.
 */
export default function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Guards against firing twice while the camera is still shutting down.
  const handledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(READER_ID, { verbose: false });
    scannerRef.current = scanner;

    const stop = async () => {
      try {
        if (scanner.isScanning) await scanner.stop();
        scanner.clear();
      } catch {
        // already stopped
      }
    };

    scanner
      .start(
        { facingMode: 'environment' }, // rear camera
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decodedText) => {
          if (handledRef.current) return;
          handledRef.current = true;
          stop().then(() => onDetected(decodedText));
        },
        () => {
          // Called constantly for frames without a barcode — ignore.
        }
      )
      .then(() => {
        if (!cancelled) setStatus('scanning');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const raw = err instanceof Error ? err.message : String(err);
        setStatus('error');
        if (/NotAllowedError|Permission/i.test(raw)) {
          setError('Camera access was blocked. Allow camera permission for this site, then try again.');
        } else if (/NotFoundError|no camera/i.test(raw)) {
          setError('No camera found on this device.');
        } else if (!window.isSecureContext) {
          setError('The camera only works over https. Open the deployed site rather than a plain http address.');
        } else {
          setError(raw.slice(0, 140));
        }
      });

    return () => {
      cancelled = true;
      stop();
    };
  }, [onDetected]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#e8aa80]/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8aa80]/20">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#a24809]" />
            <span className="font-display font-bold text-[#a24809]">Scan a barcode</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="p-2 rounded-full text-[#c4b39c] hover:text-[#a24809] hover:bg-[#faf5ef] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-black">
          {/* html5-qrcode injects the video feed here */}
          <div id={READER_ID} className="w-full" />

          {status === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 py-16 text-white/80">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Starting the camera…</span>
            </div>
          )}
        </div>

        {status === 'error' ? (
          <div className="p-5">
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-[#faf5ef] text-[#8c735c] text-sm font-medium hover:text-[#a24809] transition-colors"
            >
              Close and search by name instead
            </button>
          </div>
        ) : (
          <p className="px-5 py-4 text-xs text-[#8c735c] text-center">
            Point the camera at the barcode on the back of the product.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
