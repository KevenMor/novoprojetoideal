"use client";

import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";
import { Camera, X, Zap } from "lucide-react";

interface ScanBoletoQuaggaProps {
  onDetect: (linha: string) => void;
  onClose: () => void;
}

export default function ScanBoletoQuagga({ onDetect, onClose }: ScanBoletoQuaggaProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const initQuagga = async () => {
      try {
        // Verificar suporte à lanterna
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        setTorchSupported(capabilities.torch || false);
        stream.getTracks().forEach(track => track.stop());

        // Configurar Quagga para ITF
        Quagga.init({
          inputStream: {
            type: "LiveStream",
            target: videoRef.current!,
            constraints: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            area: {
              top: "25%",
              right: "10%",
              left: "10%",
              bottom: "25%"
            }
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          numOfWorkers: 2,
          frequency: 10,
          decoder: {
            readers: ["i2of5_reader"],
            multiple: false
          },
          locate: true,
        }, (err) => {
          if (err) {
            console.error("Erro ao inicializar Quagga:", err);
            setError("Erro ao iniciar câmera: " + err.message);
            setLoading(false);
            return;
          }
          console.log("Quagga iniciado com sucesso");
          Quagga.start();
          setLoading(false);
        });

        // Detectar códigos
        Quagga.onDetected((data) => {
          if (data && data.codeResult && data.codeResult.code) {
            const code = data.codeResult.code.replace(/\D/g, "");
            console.log("Quagga detectou:", code, "comprimento:", code.length);
            
            if (code.length >= 44 && code.length <= 48) {
              setDetected(true);
              // Flash verde por 300ms
              setTimeout(() => {
                onDetect(code);
                Quagga.stop();
                onClose();
              }, 300);
            }
          }
        });

      } catch (err) {
        console.error("Erro ao configurar Quagga:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setLoading(false);
      }
    };

    initQuagga();

    return () => {
      try {
        Quagga.offDetected();
        Quagga.stop();
      } catch (e) {
        console.error("Erro ao parar Quagga:", e);
      }
    };
  }, [onDetect, onClose]);

  // Controle da lanterna
  const toggleTorch = async () => {
    if (!torchSupported) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      const track = stream.getVideoTracks()[0];
      
      await track.applyConstraints({
        advanced: [{ torch: !torchActive }]
      });
      
      setTorchActive(!torchActive);
    } catch (err) {
      console.error("Erro ao controlar lanterna:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-[9999]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Leitor de Código de Barras (Quagga)</h2>
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
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
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
        <div ref={videoRef} className="absolute inset-0" />
        
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