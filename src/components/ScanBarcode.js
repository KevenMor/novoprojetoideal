import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/browser";
import { X } from "lucide-react";
import ScanBarcodeZXing from "./ScanBarcodeZXing";
import ScanBarcodeQuagga from "./ScanBarcodeQuagga";

export default function ScanBarcode({ onResult, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [fallback, setFallback] = useState(false);
  const [erro, setErro] = useState(null);

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

  if (fallback) {
    return (
      <ScanBarcodeQuagga
        onResult={onResult}
        onClose={onClose}
      />
    );
  }

  return (
    <ScanBarcodeZXing
      onResult={onResult}
      onClose={onClose}
      onError={() => {
        setErro("Não foi possível ler com ZXing, tentando fallback...");
        setFallback(true);
      }}
    />
  );
} 