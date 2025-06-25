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

// Função para capturar snapshot e enviar para API
async function captureAndDecode(videoElement: HTMLVideoElement): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(videoElement, 0, 0);
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.8);
    });
    
    const formData = new FormData();
    formData.append('image', blob, 'boleto.jpg');
    
    const response = await fetch('/api/decode-boleto', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) return null;
    
    const result = await response.json();
    return result.linha || null;
  } catch (error) {
    console.error('Erro no fallback:', error);
    return null;
  }
}

export default function ScanBoletoMobile({ onDetect, onClose, onFallback }: ScanBoletoMobileProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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
      facingMode: "environment",
      width: { min: 640, ideal: 1280 },
      height: { min: 480, ideal: 720 },
      focusMode: "continuous",
      exposureMode: "continuous"
    };

    const start = (err: any) => {
      if (err) {
        console.error('Erro ao iniciar Quagga:', err);
        setError('Erro ao iniciar câmera: ' + err.message);
        return;
      }
      console.log('Quagga iniciado com sucesso');
      Quagga.start();
    };

    Quagga.init({
      inputStream: {
        type: "LiveStream",
        target: videoRef.current!,
        constraints,
        area: roi
      },
      decoder: { 
        readers: ["i2of5_reader"], 
        debug: { drawBoundingBox: false } 
      },
      locate: true,
      numOfWorkers: 0,       // iOS não suporta workers
      frequency: 5,
      singleChannel: true
    }, start);

    // Log de frames processados
    Quagga.onProcessed(() => {
      console.log("frame");
    });

    // Log de detecções
    Quagga.onDetected(({ codeResult, err }) => {
      console.log("lido:", codeResult?.code, "err:", err?.name);
      
      if (codeResult && codeResult.code) {
        const code = codeResult.code.replace(/\D/g, '');
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
                // Tentar fallback com snapshot
                handleSnapshotFallback();
              }
              return [];
            }
          }
          return next;
        });
      }
    });

    // Timeout de 5 segundos
    const tId = setTimeout(() => {
      console.log('Timeout - tentando fallback');
      handleSnapshotFallback();
    }, 5000);
    setTimeoutId(tId);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      try { 
        Quagga.offDetected(); 
        Quagga.offProcessed();
        Quagga.stop(); 
      } catch {}
    };
  }, [onDetect, onClose, attempts, isPortrait]);

  // Função para tentar fallback com snapshot
  const handleSnapshotFallback = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      console.log('Tentando fallback com snapshot...');
      const videoElement = videoRef.current?.querySelector('video') as HTMLVideoElement;
      
      if (videoElement && videoElement.readyState >= 2) {
        const linha = await captureAndDecode(videoElement);
        
        if (linha && validaLinhaDigitavel(linha)) {
          console.log('Fallback bem-sucedido:', linha);
          onDetect(linha);
          vibrateOk();
          if (timeoutId) clearTimeout(timeoutId);
          Quagga.stop();
          onClose();
          return;
        }
      }
      
      // Se fallback falhar, mostrar opção de foto
      console.log('Fallback falhou - mostrando opção de foto');
      setShowFallback(true);
      Quagga.stop();
    } catch (error) {
      console.error('Erro no fallback:', error);
      setShowFallback(true);
      Quagga.stop();
    } finally {
      setIsProcessing(false);
    }
  };

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
      
      {/* Indicador de processamento */}
      {isProcessing && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg">
          Processando...
        </div>
      )}
    </div>
  );
} 