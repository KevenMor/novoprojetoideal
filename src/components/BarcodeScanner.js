import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, Camera, AlertCircle, CheckCircle } from 'lucide-react';

const BarcodeScanner = ({ isOpen, onClose, onScan, onError }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState('Aguardando código de barras...');
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
    setStatus('Aguardando código de barras...');
    try {
      // Tentar forçar câmera traseira
      const config = {
        fps: 10,
        qrbox: { width: 320, height: 70 }, // Retangular para código de barras
        aspectRatio: 4.5,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        videoConstraints: {
          facingMode: { ideal: 'environment' }
        }
      };
      html5QrcodeScannerRef.current = new Html5QrcodeScanner(
        'reader',
        config,
        false
      );
      html5QrcodeScannerRef.current.render(
        (decodedText, decodedResult) => {
          setStatus('Código detectado! Validando...');
          const numericCode = decodedText.replace(/\D/g, '');
          if (numericCode.length === 44) {
            setSuccess('Código de barras lido com sucesso!');
            setStatus('Código válido!');
            setTimeout(() => {
              onScan(numericCode);
              onClose();
            }, 1000);
          } else {
            setError('Código inválido. A linha digitável deve ter 44 números.');
            setStatus('Aguardando código de barras...');
            setTimeout(() => setError(''), 3000);
          }
        },
        (errorMessage) => {
          setStatus('Aguardando código de barras...');
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden">
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
            <p className="text-gray-700 text-base font-medium mb-1">
              Aponte a câmera para o <b>código de barras do boleto</b> e alinhe horizontalmente dentro da área destacada.
            </p>
            <p className="text-xs text-gray-500 mb-2">
              A linha digitável deve conter <b>44 números</b>.
            </p>
            <p className="text-xs text-blue-700 mb-2">
              Dica: Evite sombras e aproxime até o código ficar nítido.
            </p>
            <div className="flex items-center justify-center mb-2">
              <span className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1 animate-pulse">{status}</span>
            </div>
          </div>

          {/* Scanner Container */}
          <div className="relative flex items-center justify-center" style={{ minHeight: 120 }}>
            <div id="reader" className="w-full" style={{ minHeight: 120 }}></div>
            {/* Overlay para destacar área de leitura */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div style={{
                width: 320,
                height: 70,
                border: '3px solid #2563eb',
                borderRadius: 16,
                boxShadow: '0 0 0 4px rgba(37,99,235,0.15)',
                background: 'rgba(255,255,255,0.03)'
              }} className="animate-pulse"></div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 text-sm mb-2">Dicas para melhor leitura:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Mantenha o código de barras bem iluminado</li>
              <li>• Alinhe o código horizontalmente dentro da área azul</li>
              <li>• Evite reflexos e sombras</li>
              <li>• Mantenha o dispositivo estável</li>
              <li>• Aproxime até o código ficar nítido</li>
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