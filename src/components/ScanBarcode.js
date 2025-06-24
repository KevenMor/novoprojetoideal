import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/browser";
import { X } from "lucide-react";

export default function ScanBarcode({ onResult, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let reader = new BrowserMultiFormatReader();
    let active = true;

    async function startScanner() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const backCam =
          devices.find((d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("traseira")
          )?.deviceId || devices[0]?.deviceId;

        if (!backCam) {
          setError("Nenhuma câmera encontrada.");
          return;
        }

        reader.decodeFromVideoDevice(
          backCam,
          videoRef.current,
          (result, err) => {
            if (result) {
              onResult(result.getText().replace(/\D/g, ""));
              onClose();
              reader.reset();
            } else if (err && !(err instanceof NotFoundException)) {
              setError("Erro ao ler código: " + err.message);
            }
          }
        );
      } catch (e) {
        setError("Erro ao acessar câmera: " + (e?.message || e));
      }
    }

    if (active) startScanner();

    return () => {
      active = false;
      reader.reset();
    };
  }, [onResult, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
      <div className="absolute top-0 right-0 p-4">
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 hover:bg-white/20 p-2"
          aria-label="Fechar leitor"
        >
          <X className="w-7 h-7 text-white" />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <video
          ref={videoRef}
          className="rounded-lg border-4 border-blue-600 shadow-lg w-[90vw] max-w-md aspect-video object-cover"
          autoPlay
          muted
          playsInline
        />
        <div className="mt-4 text-center">
          <p className="text-white text-lg font-semibold">
            Aponte a câmera para o código de barras
          </p>
          <p className="text-blue-200 text-sm mt-1">
            Alinhe o código horizontalmente na área destacada
          </p>
          {error && (
            <p className="text-red-400 mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
} 