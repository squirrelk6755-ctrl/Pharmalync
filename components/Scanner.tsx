
import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onClose, title = "Scan QR Code" }) => {
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const qrRef = useRef<Html5Qrcode | null>(null);
  const readerId = "reader-active-container";

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const timer = setTimeout(async () => {
      try {
        const element = document.getElementById(readerId);
        if (!element) return;

        html5QrCode = new Html5Qrcode(readerId);
        qrRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { 
            fps: 10, 
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdge * 0.7);
              return { width: qrboxSize, height: qrboxSize };
            }
          },
          (decodedText) => {
            console.log("QR Scanned:", decodedText);
            html5QrCode?.stop().then(() => {
              onScan(decodedText);
            }).catch(() => onScan(decodedText));
          },
          () => {} // Ignore failure logs to keep console clean
        );
      } catch (err) {
        console.error("Scanner Error:", err);
        setError("Camera failed. Check browser permissions or another app is using the camera.");
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (qrRef.current && qrRef.current.isScanning) {
        qrRef.current.stop().catch(e => console.error("Scanner cleanup failure", e));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl border">
        <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
          <h3 className="font-bold flex items-center gap-2"><Camera size={20} /> {title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>
        <div className="p-6 bg-slate-50">
          <div id={readerId} className="overflow-hidden rounded-2xl bg-black aspect-square mb-6 border-4 border-white shadow-lg"></div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 font-semibold">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <div className="pt-4 border-t">
            <p className="text-[10px] font-bold text-slate-400 uppercase text-center mb-3">Manual Input</p>
            <div className="flex gap-2">
              <input 
                className="flex-1 border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Enter Patient Phone or ID"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onScan(manualInput)}
              />
              <button 
                onClick={() => onScan(manualInput)} 
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-colors"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
