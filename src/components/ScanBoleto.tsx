"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";
import { Camera, X, Zap } from "lucide-react";
import Tesseract from 'tesseract.js';

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
  const [partialCodes, setPartialCodes] = useState<string[]>([]);
  const [concatCode, setConcatCode] = useState<string>("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  useEffect(() => {
    let reader: BrowserMultiFormatReader;
    let timeoutId: NodeJS.Timeout;

    const initScanner = async () => {
      try {
        console.log('[ZXing] Solicitando permissão para câmera...');
        await navigator.mediaDevices.getUserMedia({ video: true });

        // Listar dispositivos após permissão
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        console.log('[ZXing] Dispositivos de vídeo encontrados:', videoDevices);
        let backCamera = videoDevices.find(d =>
          /back|traseira|rear/i.test(d.label)
        )?.deviceId;

        if (!backCamera && videoDevices.length > 0) {
          backCamera = videoDevices[0].deviceId;
        }

        // Constraints otimizadas
        let constraints;
        if (backCamera) {
          constraints = {
            video: {
              deviceId: { exact: backCamera },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              facingMode: 'environment',
              focusMode: 'continuous',
              exposureMode: 'continuous',
              advanced: [
                { focusMode: 'continuous' },
                { exposureMode: 'continuous' }
              ]
            }
          };
        } else {
          constraints = {
            video: {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              focusMode: 'continuous',
              exposureMode: 'continuous',
              advanced: [
                { focusMode: 'continuous' },
                { exposureMode: 'continuous' }
              ]
            }
          };
        }
        console.log('[ZXing] Constraints aplicadas:', constraints);

        // Verificar suporte à lanterna e capabilities
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        console.log('[ZXing] Capabilities da câmera:', capabilities);
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
              setPartialCodes(prev => {
                if (prev[prev.length-1] === code) return prev;
                return [...prev, code];
              });
              setConcatCode(prev => {
                if (prev.length < 44) return prev + code;
                return prev;
              });
              const currentConcat = concatCode + code;
              if (currentConcat.length >= 44 && currentConcat.length <= 48) {
                setDetected(true);
                setTimeout(() => {
                  onDetect(currentConcat);
                  try {
                    if (reader && typeof reader.reset === 'function') {
                      reader.reset();
                      reader = undefined;
                    }
                  } catch (e) {
                    console.error('[ZXing] Erro ao resetar:', e);
                  }
                  onClose();
                }, 300);
              } else if (code.length >= 44 && code.length <= 48) {
                setDetected(true);
                setTimeout(() => {
                  onDetect(code);
                  try {
                    if (reader && typeof reader.reset === 'function') {
                      reader.reset();
                      reader = undefined;
                    }
                  } catch (e) {
                    console.error('[ZXing] Erro ao resetar:', e);
                  }
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

        timeoutId = setTimeout(() => {
          console.log("[ZXing] Timeout - ativando fallback Quagga");
          try {
            if (reader && typeof reader.reset === 'function') {
              reader.reset();
              reader = undefined;
            }
          } catch (e) {
            console.error('[ZXing] Erro ao resetar:', e);
          }
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

  // Função para processar imagem com Tesseract.js
  const handleOcrImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrResult(null);
    try {
      // Trocar idioma para 'eng' (melhor para números)
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log('[OCR]', m)
      });
      const rawText = data.text;
      // Exibir texto bruto para debug
      console.log('[OCR] Texto extraído:', rawText);
      // Procurar sequências de 40 a 60 dígitos
      const match = rawText.replace(/\D/g, ' ').match(/\d{40,60}/g);
      if (match && match[0]) {
        setOcrResult('Linha digitável encontrada: ' + match[0]);
        onDetect(match[0]);
        onClose();
      } else {
        setOcrResult('Não foi possível encontrar a linha digitável na imagem. Texto extraído: ' + rawText);
      }
    } catch (err) {
      setOcrResult('Erro ao processar imagem.');
      console.error('[OCR] Erro:', err);
    }
    setOcrLoading(false);
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

      {/* Botão OCR IA */}
      <div className="flex justify-center gap-2 mb-2">
        <label className="bg-green-600 text-white p-2 rounded-lg text-center cursor-pointer text-sm font-medium hover:bg-green-700 transition">
          Ler por foto (IA)
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleOcrImage}
            className="hidden"
          />
        </label>
      </div>
      <div className="text-xs text-center text-white mb-2">Tire a foto o mais próximo possível da linha digitável impressa no boleto para melhores resultados.</div>
      {ocrLoading && (
        <div className="p-2 text-center text-yellow-400">Processando imagem, aguarde...</div>
      )}
      {ocrResult && (
        <div className="p-2 text-center text-white bg-black/70 rounded mb-2 text-xs break-all">{ocrResult}</div>
      )}

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
          <div className="border-4 border-green-400 shadow-lg w-96 max-w-full h-24 rounded-xl bg-black/10" />
        </div>

        {/* Flash verde em detecção */}
        {detected && (
          <div className="absolute inset-0 bg-green-500 animate-ping opacity-50" />
        )}

        {/* Exibir códigos lidos em tempo real */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs rounded px-2 py-1 max-w-[90%] break-all z-20">
          <div><b>Códigos lidos:</b> {partialCodes.join(' | ')}</div>
          {concatCode && <div><b>Concatenado:</b> {concatCode}</div>}
          <div className="mt-1">Aproxime e alinhe o código. Se não conseguir, tente o modo fallback.</div>
        </div>
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