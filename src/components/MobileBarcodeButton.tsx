import React, { useState } from 'react';
import ScanBoletoMobile from './ScanBoletoMobile.tsx';

interface MobileBarcodeButtonProps {
  onDetect: (linha: string) => void;
}

const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);

export default function MobileBarcodeButton({ onDetect }: MobileBarcodeButtonProps) {
  const [open, setOpen] = useState(false);
  if (!isMobile) return null;
  return (
    <>
      <button
        type="button"
        className="ml-2 px-3 py-2 rounded-lg bg-blue-600 text-white font-medium flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <span role="img" aria-label="Ler código">📷</span> Ler código
      </button>
      {open && (
        <ScanBoletoMobile
          onDetect={linha => { setOpen(false); onDetect(linha); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
} 