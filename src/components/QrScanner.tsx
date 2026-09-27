/**
 * @file QrScanner.tsx
 * @description Camera QR scanner for prefilling a player's details.
 *
 * Uses the browser's native BarcodeDetector where it exists (Android Chrome) and
 * falls back to jsQR on a canvas everywhere else, so iOS Safari works too. Also
 * accepts a photo of a QR, for anyone whose camera is blocked or unavailable.
 */

import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { X, Camera, Image as ImageIcon, AlertTriangle } from 'lucide-react';

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

export function QrScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let detector: any = null;

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };

    const scan = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (cancelled || !video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }

      try {
        if (detector) {
          const codes = await detector.detect(video);
          if (codes.length > 0 && codes[0].rawValue) {
            stop();
            onResult(codes[0].rawValue);
            return;
          }
        } else {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const found = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (found?.data) {
            stop();
            onResult(found.data);
            return;
          }
        }
      } catch {
        // A single bad frame is not worth surfacing; keep looking.
      }
      rafRef.current = requestAnimationFrame(scan);
    };

    (async () => {
      try {
        if ('BarcodeDetector' in window) {
          const formats = await (window as any).BarcodeDetector.getSupportedFormats?.();
          if (!formats || formats.includes('qr_code')) {
            detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          }
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStarting(false);
        scan();
      } catch (err: any) {
        setStarting(false);
        setError(
          err?.name === 'NotAllowedError'
            ? 'Camera permission was refused. Allow it in your browser, or upload a photo of the QR instead.'
            : 'Could not open the camera on this device. Upload a photo of the QR instead.'
        );
      }
    })();

    return () => { cancelled = true; stop(); };
  }, [onResult]);

  // Decoding a still photo covers blocked cameras and desktops with no webcam.
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = jsQR(data.data, data.width, data.height);
      if (found?.data) onResult(found.data);
      else setError('No QR code found in that image. Try a clearer, closer photo.');
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[6px_6px_0_0_#000] w-full max-w-sm p-4 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-[#111827] pb-2">
          <h3 className="font-arcade text-sm font-bold flex items-center gap-2">
            <Camera className="w-4 h-4" /> SCAN STUDENT QR
          </h3>
          <button onClick={onClose} className="p-1 border-2 border-[#111827] bg-[#F7E8B5]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative bg-black border-2 border-[#111827] aspect-square overflow-hidden">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-arcade">
              STARTING CAMERA…
            </div>
          )}
          {!starting && !error && (
            <div className="absolute inset-8 border-2 border-[#F4C430] pointer-events-none" />
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-2.5 bg-[#C62828]/10 border-2 border-[#C62828] text-[#C62828] text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-[11px] text-[#111827]/60 text-center">
          Hold the student ID QR inside the frame
        </p>

        <label className="flex items-center justify-center gap-2 text-[11px] font-bold py-2 border-2 border-[#111827] bg-[#F7E8B5] cursor-pointer hover:bg-[#F4C430]">
          <ImageIcon className="w-4 h-4" /> Upload a photo of the QR instead
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      </div>
    </div>
  );
}

export default QrScanner;
