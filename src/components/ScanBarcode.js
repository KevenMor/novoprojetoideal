import { useState, useEffect } from "react";
import ScanBarcodeZXing from "./ScanBarcodeZXing";
import ScanBarcodeQuagga from "./ScanBarcodeQuagga";

export default function ScanBarcode({ onResult, onClose }) {
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("ScanBarcode montado");
    
    // Verificar se o dispositivo suporta câmera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Seu dispositivo não suporta acesso à câmera");
      setLoading(false);
    }
    
    return () => {
      console.log("ScanBarcode desmontado");
    };
  }, []);

  // Função para processar o código lido
  const handleResult = (code) => {
    console.log("Código lido com sucesso:", code);
    
    // Validar o código antes de enviar para o componente pai
    if (code && code.length >= 44 && code.length <= 48) {
      onResult(code);
    } else {
      setError(`Código inválido (${code?.length || 0} dígitos). A linha digitável deve ter entre 44 e 48 números.`);
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Função para lidar com erros
  const handleError = (err) => {
    console.error("Erro no scanner:", err);
    setError(err.message || "Erro ao acessar a câmera");
    setFallback(true);
  };

  console.log("ScanBarcode renderizando, fallback:", fallback);

  if (error && !fallback) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4">
        <div className="bg-red-600/80 text-white p-4 rounded-lg max-w-sm text-center mb-4">
          <h3 className="text-lg font-bold mb-2">Erro</h3>
          <p>{error}</p>
        </div>
        <button 
          onClick={onClose}
          className="bg-white text-black font-medium py-3 px-6 rounded-lg"
        >
          Fechar
        </button>
      </div>
    );
  }

  if (fallback) {
    console.log("Usando Quagga como fallback");
    return (
      <ScanBarcodeQuagga
        onResult={handleResult}
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
        onResult={handleResult}
        onClose={onClose}
        onError={handleError}
      />
    </div>
  );
} 