import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

export default function ScanBarcodeQuagga({ onResult, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            facingMode: "environment",
          },
        },
        decoder: {
          readers: ["i2of5_reader"],
        },
        locate: true,
        numOfWorkers: 1,
      },
      (err) => {
        if (err) {
          setError("Erro ao iniciar câmera: " + err.message);
          return;
        }
        Quagga.start();
      }
    );
    Quagga.onDetected((data) => {
      if (data && data.codeResult && data.codeResult.code) {
        onResult(data.codeResult.code.replace(/\D/g, ""));
        Quagga.stop();
        onClose();
      }
    });
    return () => {
      Quagga.offDetected();
      Quagga.stop();
    };
  }, [onResult, onClose]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Quagga.decodeSingle(
      {
        src: URL.createObjectURL(file),
        numOfWorkers: 0,
        decoder: { readers: ["i2of5_reader"] },
      },
      (result) => {
        if (result && result.codeResult) {
          onResult(result.codeResult.code.replace(/\D/g, ""));
          onClose();
        } else {
          setError("Não foi possível ler o código na imagem.");
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      <div ref={videoRef} className="flex-1" />
      <div className="p-4 flex flex-col gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="text-white"
        />
        {error && <div className="text-red-400">{error}</div>}
        <button
          onClick={onClose}
          className="text-white text-lg py-4 font-medium bg-primary"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
} 