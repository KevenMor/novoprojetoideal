import { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

export default function ScanBarcodeQuagga({ onResult, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("ScanBarcodeQuagga montado");
    setLoading(true);

    try {
      console.log("Inicializando Quagga...");
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              facingMode: "environment",
              width: { min: 640 },
              height: { min: 480 },
              aspectRatio: { min: 1, max: 2 }
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          numOfWorkers: navigator.hardwareConcurrency || 2,
          frequency: 10,
          decoder: {
            readers: ["i2of5_reader"],
            multiple: false,
            debug: {
              showCanvas: true,
              showPatches: true,
              showFoundPatches: true,
              showSkeleton: true,
              showLabels: true,
              showPatchLabels: true,
              showRemainingPatchLabels: true
            }
          },
          locate: true,
        },
        (err) => {
          if (err) {
            console.error("Erro ao iniciar Quagga:", err);
            setError("Erro ao iniciar câmera: " + err.message);
            setLoading(false);
            return;
          }
          console.log("Quagga iniciado com sucesso");
          Quagga.start();
          setLoading(false);
        }
      );

      Quagga.onDetected((data) => {
        console.log("Quagga detectou código:", data?.codeResult?.code);
        if (data && data.codeResult && data.codeResult.code) {
          const code = data.codeResult.code.replace(/\D/g, "");
          console.log("Código processado:", code);
          onResult(code);
          Quagga.stop();
          onClose();
        }
      });
    } catch (e) {
      console.error("Erro ao configurar Quagga:", e);
      setError(`Erro ao configurar leitor: ${e.message || e}`);
      setLoading(false);
    }

    return () => {
      console.log("ScanBarcodeQuagga desmontando...");
      try {
        Quagga.offDetected();
        Quagga.stop();
        console.log("Quagga parado");
      } catch (e) {
        console.error("Erro ao parar Quagga:", e);
      }
    };
  }, [onResult, onClose]);

  const handleFile = (e) => {
    console.log("Processando arquivo...");
    const file = e.target.files[0];
    if (!file) {
      console.log("Nenhum arquivo selecionado");
      return;
    }
    
    try {
      setLoading(true);
      console.log("Decodificando imagem com Quagga...");
      Quagga.decodeSingle(
        {
          src: URL.createObjectURL(file),
          numOfWorkers: 0,
          inputStream: {
            size: 800
          },
          decoder: { 
            readers: ["i2of5_reader"],
            debug: {
              drawBoundingBox: true,
              showFrequency: true,
              drawScanline: true,
              showPattern: true
            }
          },
        },
        (result) => {
          setLoading(false);
          if (result && result.codeResult) {
            console.log("Quagga leu código da imagem:", result.codeResult.code);
            onResult(result.codeResult.code.replace(/\D/g, ""));
            onClose();
          } else {
            console.log("Não foi possível ler código da imagem");
            setError("Não foi possível ler o código na imagem.");
          }
        }
      );
    } catch (e) {
      console.error("Erro ao processar imagem:", e);
      setError(`Erro ao processar imagem: ${e.message || e}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-[9999]">
      <div className="p-4 text-white text-center">
        <h2 className="text-xl font-bold mb-2">Leitor de Código de Barras (Quagga)</h2>
        <p className="text-sm">Posicione o código de barras na frente da câmera</p>
      </div>
      
      {loading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p>{error ? "Erro" : "Processando..."}</p>
          </div>
        </div>
      )}
      
      <div ref={videoRef} className="flex-1 relative" />
      
      <div className="p-4 flex flex-col gap-2">
        <label className="bg-blue-600 text-white p-3 rounded-lg text-center cursor-pointer">
          Tentar com imagem
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </label>
        
        {error && <div className="text-red-400 bg-red-900/30 p-2 rounded text-center">{error}</div>}
        
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