import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";

export default function ScanBarcodeZXing({ onResult, onClose, onError }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    console.log("ScanBarcodeZXing montado");
    setLoading(true);
    let reader;

    try {
      console.log("Inicializando ZXing...");
      const hints = new Map();
      // Configurar para reconhecer códigos de barras comuns
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.ITF,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      reader = new BrowserMultiFormatReader(hints, 500);
      console.log("ZXing inicializado");

      reader.listVideoInputDevices()
        .then(async (devices) => {
          console.log("Câmeras disponíveis:", devices);
          
          if (!devices || devices.length === 0) {
            const err = new Error("Nenhuma câmera encontrada");
            console.error(err);
            setErrorMsg("Nenhuma câmera encontrada");
            setLoading(false);
            onError && onError(err);
            return;
          }

          // Tentar usar câmera traseira primeiro
          const deviceId =
            devices.find((d) => /back|traseira|rear/i.test(d.label))?.deviceId ||
            devices[0]?.deviceId;
            
          console.log("Usando câmera:", deviceId);

          try {
            await reader.decodeFromVideoDevice(
              deviceId,
              videoRef.current,
              (res, err) => {
                if (res) {
                  const code = res.getText().replace(/\D/g, "");
                  console.log("Código lido:", code, "Comprimento:", code.length);
                  
                  // Verificar se o código tem o comprimento correto
                  if (code.length >= 44 && code.length <= 48) {
                    console.log("Código válido detectado:", code);
                    onResult(code);
                    reader.reset();
                    onClose();
                  } else {
                    console.log("Código com comprimento inválido:", code.length);
                  }
                }
                
                if (err && !(err instanceof NotFoundException)) {
                  console.error("Erro na leitura:", err);
                  setErrorMsg(`Erro: ${err.message || "Desconhecido"}`);
                  onError && onError(err);
                }
              }
            );
            console.log("Câmera iniciada com sucesso");
            setLoading(false);
          } catch (e) {
            console.error("Erro ao iniciar câmera:", e);
            setErrorMsg(`Erro ao iniciar câmera: ${e.message || e}`);
            setLoading(false);
            onError && onError(e);
          }
        })
        .catch(error => {
          console.error("Erro ao listar câmeras:", error);
          setErrorMsg(`Erro ao listar câmeras: ${error.message || error}`);
          setLoading(false);
          onError && onError(error);
        });
    } catch (e) {
      console.error("Erro ao inicializar ZXing:", e);
      setErrorMsg(`Erro ao inicializar: ${e.message || e}`);
      setLoading(false);
      onError && onError(e);
    }

    return () => {
      console.log("ScanBarcodeZXing desmontando...");
      if (reader) {
        try {
          reader.reset();
          console.log("ZXing resetado");
        } catch (e) {
          console.error("Erro ao resetar ZXing:", e);
        }
      }
    };
  }, [onResult, onClose, onError]);

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
        <h2 className="text-xl font-bold mb-2">Leitor de Código de Barras</h2>
        <p className="text-sm">Posicione o código de barras na frente da câmera</p>
      </div>
      
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p>Iniciando câmera...</p>
          </div>
        </div>
      )}
      
      {errorMsg && (
        <div className="p-4 bg-red-600 text-white text-center">
          {errorMsg}
        </div>
      )}
      
      <div className="flex-1 relative">
        <video 
          ref={videoRef} 
          className="absolute inset-0 w-full h-full object-cover" 
          muted 
          autoPlay 
          playsInline
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-blue-500 w-4/5 h-32 rounded-lg"></div>
        </div>
      </div>
      
      <div className="p-4 flex flex-col gap-2">
        <button
          onClick={handleManualInput}
          className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium"
        >
          Digitar código manualmente
        </button>
        
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