"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";
import { Camera, X, Zap } from "lucide-react";

interface ScanBoletoProps {
  onDetect: (linha: string) => void;
  onClose: () => void;
}

export default function ScanBoleto({ onDetect, onClose }: ScanBoletoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    let reader: BrowserMultiFormatReader;
    let timeoutId: NodeJS.Timeout;

    const initScanner = async () => {
      try {
        // 1. Solicitar permissão para a câmera antes de listar devices
        await navigator.mediaDevices.getUserMedia({ video: true });

        // 2. Listar dispositivos após permissão
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        let backCamera = videoDevices.find(d =>
          /back|traseira|rear/i.test(d.label)
        )?.deviceId;

        // 3. Fallback para a primeira câmera disponível
        if (!backCamera && videoDevices.length > 0) {
          backCamera = videoDevices[0].deviceId;
        }

        // 4. Se não encontrar deviceId, usar facingMode: 'environment'
        let constraints;
        if (backCamera) {
          constraints = {
            video: {
              deviceId: { exact: backCamera },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'environment'
            }
          };
        } else {
          constraints = {
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          };
        }

        // Verificar suporte à lanterna
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        setTorchSupported(capabilities.torch || false);
        stream.getTracks().forEach(track => track.stop());

        // Configurar ZXing para ITF, CODE_128 e CODE_39 com TRY_HARDER
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.ITF, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        reader = new BrowserMultiFormatReader(hints, 10000); // 10s timeout

        // Iniciar decodificação
        await reader.decodeFromVideoDevice(
          backCamera || undefined,
          videoRef.current!,
          (result, err) => {
            if (result) {
              const code = result.getText().replace(/\D/g, "");
              console.log("[ZXing] Detectou:", code, "comprimento:", code.length);
              
              if (code.length >= 44 && code.length <= 48) {
                setDetected(true);
                // Flash verde por 300ms
                setTimeout(() => {
                  onDetect(code);
                  reader.reset();
                  onClose();
                }, 300);
              } else {
                console.log(`[ZXing] Código detectado mas fora do padrão esperado (44-48): ${code}`);
              }
            }
            
            if (err && !(err instanceof NotFoundException)) {
              console.error("[ZXing] Erro:", err);
              setError(err.message);
            }
          }
        );

        setLoading(false);

        // Timeout de 10s para fallback
        timeoutId = setTimeout(() => {
          console.log("[ZXing] Timeout - ativando fallback Quagga");
          reader.reset();
          setShowFallback(true);
        }, 10000);

      } catch (err) {
        console.error("[ZXing] Erro ao inicializar:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setLoading(false);
      }
    };

    initScanner();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (reader) {
        try {
          reader.reset();
        } catch (e) {
          console.error("Erro ao resetar ZXing:", e);
        }
      }
    };
  }, [onDetect, onClose]);

  // Controle da lanterna
  const toggleTorch = async () => {
    if (!torchSupported || !videoRef.current) return;

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      
      await track.applyConstraints({
        advanced: [{ torch: !torchActive }]
      });
      
      setTorchActive(!torchActive);
    } catch (err) {
      console.error("Erro ao controlar lanterna:", err);
    }
  };

  // Fallback para Quagga
  if (showFallback) {
    const ScanBoletoQuagga = require("./ScanBoletoQuagga.tsx").default;
    return <ScanBoletoQuagga onDetect={onDetect} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-[9999]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Leitor de Código de Barras</h2>
        </div>
        <div className="flex items-center gap-2">
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-lg transition ${
                torchActive ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'
              }`}
              aria-label="Alternar lanterna"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 bg-gray-700 text-white rounded-lg"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4" />
            <p>Iniciando câmera...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-600 text-white text-center">
          {error}
        </div>
      )}

      {/* Video Container */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain"
          muted
          autoPlay
          playsInline
        />
        
        {/* Retângulo-guia */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-primary w-80 h-20 rounded-lg" />
        </div>

        {/* Flash verde em detecção */}
        {detected && (
          <div className="absolute inset-0 bg-green-500 animate-ping opacity-50" />
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 text-white text-center">
        <p className="text-sm">
          Posicione o código de barras do boleto dentro da área destacada
        </p>
      </div>
    </div>
  );
} 