import React, { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';

interface ScanBoletoMobileProps {
  onDetect: (linha: string) => void;
  onClose: () => void;
}

const GUIDE_WIDTH = 320;
const GUIDE_HEIGHT = 90;

export default function ScanBoletoMobile({ onDetect, onClose }: ScanBoletoMobileProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Lock orientation
    if (typeof window !== 'undefined' && window.screen.orientation && window.screen.orientation.lock) {
      window.screen.orientation.lock('landscape').catch(() => {});
    }
    // Start Quagga
    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: videoRef.current!,
        constraints: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        area: {
          top: '35%',
          right: '10%',
          left: '10%',
          bottom: '35%'
        }
      },
      decoder: {
        readers: ['i2of5_reader']
      },
      locate: true,
      numOfWorkers: 2,
      frequency: 5,
    }, (err) => {
      if (err) {
        setError('Erro ao iniciar câmera: ' + err.message);
        return;
      }
      Quagga.start();
    });
    // Timeout
    const tId = setTimeout(() => {
      setError('Não foi possível ler o código. Tente alinhar melhor ou digite manualmente.');
      Quagga.stop();
    }, 5000);
    setTimeoutId(tId);
    // On detect
    Quagga.onDetected((data) => {
      if (data && data.codeResult && data.codeResult.code) {
        const code = data.codeResult.code.replace(/\D/g, '');
        if (code.length >= 44 && code.length <= 48) {
          if (timeoutId) clearTimeout(timeoutId);
          Quagga.stop();
          if (navigator.vibrate) navigator.vibrate(50);
          onDetect(code);
          onClose();
        }
      }
    });
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      try { Quagga.offDetected(); Quagga.stop(); } catch {}
      if (typeof window !== 'undefined' && window.screen.orientation && window.screen.orientation.unlock) {
        try { window.screen.orientation.unlock(); } catch {}
      }
    };
  }, [onDetect, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90">
      <div ref={videoRef} className="absolute inset-0 w-full h-full" />
      {/* Overlay guia */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: GUIDE_WIDTH, height: GUIDE_HEIGHT }} className="border-4 border-blue-500 rounded-lg bg-black/10" />
      </div>
      {/* Mensagem erro/timeout */}
      {error && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg text-center">
          {error}
          <button onClick={onClose} className="ml-4 underline">Fechar</button>
        </div>
      )}
    </div>
  );
} 