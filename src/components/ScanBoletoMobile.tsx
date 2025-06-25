import React, { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';

interface ScanBoletoMobileProps {
  onDetect: (linha: string) => void;
  onClose: () => void;
  onFallback?: () => void;
}

const VOTING_FRAMES = 5;
const MAX_ATTEMPTS = 3;

function mode(arr: string[]): string {
  const freq: Record<string, number> = {};
  let max = 0, res = '';
  for (const v of arr) {
    freq[v] = (freq[v] || 0) + 1;
    if (freq[v] > max) {
      max = freq[v];
      res = v;
    }
  }
  return res;
}

function modulo10(num: string): number {
  let soma = 0, mult = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    let res = Number(num[i]) * mult;
    if (res > 9) res = 1 + (res - 10);
    soma += res;
    mult = mult === 2 ? 1 : 2;
  }
  const dv = (10 - (soma % 10)) % 10;
  return dv;
}

function modulo11(num: string): number {
  let soma = 0, peso = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    soma += Number(num[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  if (resto === 0 || resto === 1) return 1;
  if (resto === 10) return 1;
  return 11 - resto;
}

function validaLinhaDigitavel(linha: string): boolean {
  linha = linha.replace(/\D/g, '');
  if (linha.length !== 47 && linha.length !== 48) return false;
  // Blocos
  const b1 = linha.slice(0, 9), dv1 = Number(linha[9]);
  const b2 = linha.slice(10, 20), dv2 = Number(linha[20]);
  const b3 = linha.slice(21, 31), dv3 = Number(linha[31]);
  if (modulo10(b1) !== dv1) return false;
  if (modulo10(b2) !== dv2) return false;
  if (modulo10(b3) !== dv3) return false;
  // DV geral (posição 32)
  const campo4 = Number(linha[32]);
  // Para cálculo do DV geral, remover os DVs dos blocos
  const barra = linha.slice(0, 4) + linha.slice(32, 47);
  if (modulo11(barra) !== campo4) return false;
  return true;
}

function vibrateOk() {
  if (navigator.vibrate) navigator.vibrate(50);
}

function showToast(msg: string) {
  window.alert(msg); // Substitua por toast real se desejar
}

export default function ScanBoletoMobile({ onDetect, onClose, onFallback }: ScanBoletoMobileProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    // Verificar orientação atual
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    // Verificar orientação inicial
    checkOrientation();

    // Listener para mudanças de orientação
    const handleResize = () => {
      checkOrientation();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // ROI dinâmico baseado na orientação
    const roi = isPortrait
      ? { top: "35%", bottom: "35%", left: "10%", right: "10%" }   // portrait
      : { top: "45%", bottom: "45%", left: "0%", right: "0%" };    // landscape

    // Constraints otimizadas
    const constraints = {
      audio: false,
      video: {
        facingMode: { exact: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        advanced: [
          { focusMode: "continuous" },  // Android
          { zoom: 2 }                   // tenta 2× zoom (ignorado no iOS se não suportar)
        ]
      }
    };

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: videoRef.current!,
        constraints,
        area: roi
      },
      decoder: {
        readers: ['i2of5_reader'],
        debug: {
          drawBoundingBox: true,
          showFrequency: true,
          drawScanline: true,
          showPattern: true
        }
      },
      locate: true,
      singleChannel: true,
      numOfWorkers: 2,
      frequency: 5,
    }, (err) => {
      if (err) {
        setError('Erro ao iniciar câmera: ' + err.message);
        return;
      }
      Quagga.start();
    });

    // Timeout de 5 segundos
    const tId = setTimeout(() => {
      setError('Não foi possível ler o código. Tente alinhar melhor ou digite manualmente.');
      Quagga.stop();
    }, 5000);
    setTimeoutId(tId);

    // Detecção com tentativas múltiplas
    Quagga.onDetected((data) => {
      if (data && data.codeResult && data.codeResult.code) {
        const code = data.codeResult.code.replace(/\D/g, '');
        setCandidates(prev => {
          const next = [...prev, code];
          if (next.length === VOTING_FRAMES) {
            const maisFrequente = mode(next);
            if (validaLinhaDigitavel(maisFrequente)) {
              onDetect(maisFrequente);
              vibrateOk();
              if (timeoutId) clearTimeout(timeoutId);
              Quagga.stop();
              onClose();
            } else {
              const newAttempts = attempts + 1;
              if (newAttempts < MAX_ATTEMPTS) {
                setCandidates([]);
                setAttempts(newAttempts);
                showToast(`Não reconheci corretamente, aproxime mais. Tentativa ${newAttempts + 1} de ${MAX_ATTEMPTS}.`);
              } else {
                setShowFallback(true);
                Quagga.stop();
              }
              return [];
            }
          }
          return next;
        });
      }
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      try { 
        Quagga.offDetected(); 
        Quagga.stop(); 
      } catch {}
    };
  }, [onDetect, onClose, attempts, isPortrait]);

  if (showFallback) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90">
        <div className="text-white text-lg mb-4">Não foi possível ler o código de barras.</div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-base mb-4"
          onClick={() => { setShowFallback(false); onFallback && onFallback(); }}
        >
          Enviar foto do boleto
        </button>
        <button
          className="text-white underline"
          onClick={onClose}
        >Cancelar</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-black">
      {/* Container do vídeo sem rotação */}
      <div 
        ref={videoRef} 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      
      {/* "Furo" transparente dinâmico */}
      <div 
        className="absolute bg-transparent pointer-events-none"
        style={{
          left: isPortrait ? '10%' : '0%',
          right: isPortrait ? '10%' : '0%',
          top: isPortrait ? 'calc(33.33% - 8.33%)' : 'calc(50% - 8.33%)',
          height: '16.67%',
          mixBlendMode: 'destination-out'
        }}
      />
      
      {/* ROI dinâmico: portrait mais estreito, landscape full width */}
      <div
        className="absolute pointer-events-none border-4 border-blue-500/80 rounded-xl"
        style={{
          left: isPortrait ? '10%' : '0%',
          right: isPortrait ? '10%' : '0%',
          top: isPortrait ? '33.33%' : '50%',
          transform: isPortrait ? 'none' : 'translateY(-50%)',
          height: '16.67%'
        }}
      />
      
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