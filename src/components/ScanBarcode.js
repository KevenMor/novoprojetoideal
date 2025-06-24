import { useState, useEffect } from "react";
import ScanBarcodeZXing from "./ScanBarcodeZXing";
import ScanBarcodeQuagga from "./ScanBarcodeQuagga";

export default function ScanBarcode({ onResult, onClose }) {
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("ScanBarcode montado");
    return () => {
      console.log("ScanBarcode desmontado");
    };
  }, []);

  console.log("ScanBarcode renderizando, fallback:", fallback);

  if (fallback) {
    console.log("Usando Quagga como fallback");
    return (
      <ScanBarcodeQuagga
        onResult={onResult}
        onClose={onClose}
      />
    );
  }

  console.log("Tentando usar ZXing");
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
      <div className="text-white p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Abrindo câmera...</h2>
        <p>Aguarde um momento</p>
      </div>
      <ScanBarcodeZXing
        onResult={(code) => {
          console.log("ZXing leu código:", code);
          onResult(code);
        }}
        onClose={() => {
          console.log("ZXing fechado pelo usuário");
          onClose();
        }}
        onError={(err) => {
          console.error("ZXing erro:", err);
          setFallback(true);
        }}
      />
    </div>
  );
} 