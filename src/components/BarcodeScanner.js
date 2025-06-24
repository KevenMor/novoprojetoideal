import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, Camera, AlertCircle, CheckCircle } from 'lucide-react';

const BarcodeScanner = ({ isOpen, onClose, onScan, onError }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    if (isOpen && !scanning) {
      startScanner();
    }
    
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear();
      }
    };
  }, [isOpen]);

  const startScanner = () => {
    if (!isOpen) return;

    setScanning(true);
    setError('');
    setSuccess('');

    try {
      html5QrcodeScannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [
            Html5QrcodeScanType.SCAN_TYPE_CAMERA
          ]
        },
        false
      );

      html5QrcodeScannerRef.current.render(
        (decodedText, decodedResult) => {
          // Verificar se é um código de barras válido (44 dígitos para linha digitável)
          const numericCode = decodedText.replace(/\D/g, '');
          
          if (numericCode.length === 44) {
            setSuccess('Código de barras lido com sucesso!');
            setTimeout(() => {
              onScan(numericCode);
              onClose();
            }, 1000);
          } else {
            setError('Código inválido. A linha digitável deve ter 44 números.');
            setTimeout(() => setError(''), 3000);
          }
        },
        (errorMessage) => {
          // Ignorar erros de parsing que são normais durante a busca
          if (!errorMessage.includes('No MultiFormat Readers were able to detect')) {
            setError('Erro ao ler código: ' + errorMessage);
          }
        }
      );
    } catch (err) {
      setError('Erro ao inicializar câmera: ' + err.message);
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear();
      html5QrcodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Leitor de Código de Barras</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          <div className="text-center mb-4">
            <p className="text-gray-600 text-sm mb-2">
              Posicione o código de barras do boleto dentro da área destacada
            </p>
            <p className="text-xs text-gray-500">
              A linha digitável deve conter 44 números
            </p>
          </div>

          {/* Scanner Container */}
          <div className="relative">
            <div id="reader" className="w-full"></div>
            {!scanning && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Inicializando câmera...</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 text-sm mb-2">Dicas:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Mantenha o código de barras bem iluminado</li>
              <li>• Posicione a câmera a uma distância de 10-20cm</li>
              <li>• Mantenha o dispositivo estável</li>
              <li>• Certifique-se de que o código está completo na tela</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 