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
              height: { min: 480 }
            },
            area: {
              top: "25%",
              right: "10%",
              left: "10%",
              bottom: "25%"
            }
          },
          numOfWorkers: 2,
          frequency: 10,
          decoder: {
            readers: [
              "i2of5_reader",
              "code_128_reader",
              "code_39_reader"
            ]
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
          console.log("Código processado:", code, "Comprimento:", code.length);
          
          // Verificar se o código tem o comprimento correto
          if (code.length >= 44 && code.length <= 48) {
            console.log("Código válido detectado:", code);
            onResult(code);
            Quagga.stop();
            onClose();
          } else {
            console.log("Código com comprimento inválido:", code.length);
          }
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
          numOfWorkers: 2,
          decoder: { 
            readers: [
              "i2of5_reader",
              "code_128_reader",
              "code_39_reader"
            ]
          },
        },
        (result) => {
          setLoading(false);
          if (result && result.codeResult) {
            const code = result.codeResult.code.replace(/\D/g, "");
            console.log("Quagga leu código da imagem:", code, "Comprimento:", code.length);
            
            if (code.length >= 44 && code.length <= 48) {
              onResult(code);
              onClose();
            } else {
              setError(`Código inválido (${code.length} dígitos). A linha digitável deve ter entre 44 e 48 números.`);
            }
          } else {
            console.log("Não foi possível ler código da imagem");
            setError("Não foi possível ler o código na imagem. Tente com melhor iluminação e foco.");
          }
        }
      );
    } catch (e) {
      console.error("Erro ao processar imagem:", e);
      setError(`Erro ao processar imagem: ${e.message || e}`);
      setLoading(false);
    }
  };

  // Função para entrada manual do código
  const handleManualInput = () => {
    const code = prompt("Digite o código de barras manualmente (somente números):");
    if (code) {
      const cleanCode = code.replace(/\D/g, "");
      if (cleanCode.length >= 44 && cleanCode.length <= 48) {
        onResult(cleanCode);
        onClose();
      } else {
        alert(`Código inválido. O código deve ter entre 44 e 48 números. (Digitado: ${cleanCode.length})`);
      }
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
        <button
          onClick={handleManualInput}
          className="bg-blue-600 text-white p-3 rounded-lg text-center font-medium"
        >
          Digitar código manualmente
        </button>
        
        <label className="bg-green-600 text-white p-3 rounded-lg text-center cursor-pointer">
          Tentar com imagem
          <input
            type="file"
            accept="image/*"
            capture="environment"
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