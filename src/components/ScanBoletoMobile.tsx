import React, { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';

interface ScanBoletoMobileProps {
  onDetect: (linha: string) => void;
  onClose: () => void;
  onFallback?: () => void;
}

const VOTING_FRAMES = 5;
const MAX_ATTEMPTS = 3;

// ROI: 90% largura, 25% altura, centralizado
const ROI = {
  top: "37.5%",
  bottom: "37.5%",
  left: "5%",
  right: "5%"
};

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
  const [isLandscape, setIsLandscape] = useState(false);
  const [showRotateMessage, setShowRotateMessage] = useState(false);

  useEffect(() => {
    // Verificar orientação atual
    const checkOrientation = () => {
      const landscape = window.matchMedia("(orientation: landscape)").matches;
      setIsLandscape(landscape);
      setShowRotateMessage(!landscape);
    };

    // Verificar orientação inicial
    checkOrientation();

    // Listener para mudanças de orientação
    const mediaQuery = window.matchMedia("(orientation: landscape)");
    const handleOrientationChange = () => {
      checkOrientation();
    };

    mediaQuery.addListener(handleOrientationChange);

    // Tentar forçar landscape (funciona em alguns browsers)
    const lock = async () => {
      if (typeof window !== 'undefined' && window.screen?.orientation?.lock) {
        try { 
          await window.screen.orientation.lock("landscape"); 
          checkOrientation();
        } catch (e) {
          console.log('Não foi possível forçar landscape:', e);
          // Fallback: aguardar usuário girar manualmente
        }
      }
    };
    lock();

    return () => {
      mediaQuery.removeListener(handleOrientationChange);
      if (typeof window !== 'undefined' && window.screen?.orientation?.unlock) {
        try { 
          window.screen.orientation.unlock(); 
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    // Só iniciar Quagga se estiver em landscape
    if (!isLandscape) return;

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
        area: ROI
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
  }, [onDetect, onClose, attempts, isLandscape]);

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

  if (showRotateMessage) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90">
        <div className="text-white text-center">
          <div className="text-2xl mb-4">📱</div>
          <div className="text-lg mb-2">Gire o telefone para horizontal</div>
          <div className="text-sm opacity-80">O scanner funciona melhor na orientação paisagem</div>
          <button
            className="mt-6 text-white underline"
            onClick={onClose}
          >Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Container do vídeo com CSS inline */}
      <div 
        ref={videoRef} 
        className="absolute inset-0 w-full h-full"
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: 'cover'
        }}
      />
      
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      
      {/* "Furo" transparente acima do ROI */}
      <div 
        className="absolute bg-transparent pointer-events-none"
        style={{
          left: '5%',
          right: '5%',
          top: 'calc(50% - 12.5%)',
          height: '25%',
          mixBlendMode: 'destination-out'
        }}
      />
      
      {/* ROI: 90% largura, 25% altura, centralizado */}
      <div 
        className="absolute border-4 border-blue-500/80 rounded-xl pointer-events-none"
        style={{
          left: '5%',
          right: '5%',
          top: '50%',
          transform: 'translateY(-50%)',
          height: '25%'
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