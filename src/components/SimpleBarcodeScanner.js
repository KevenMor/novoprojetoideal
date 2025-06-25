import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Camera, X, AlertCircle, CheckCircle, Upload, Wifi, WifiOff } from 'lucide-react';

const SimpleBarcodeScanner = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState('Iniciando câmera...');
  const [mode, setMode] = useState('camera'); // camera | image
  const [reader, setReader] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [showFallback, setShowFallback] = useState(false);

  // Detectar iOS/Safari
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOSorSafari = isIOS || isSafari;

  // Função para extrair linha digitável mantendo DVs
  function extrairLinhaDigitavel(texto) {
    // Extrai todos os grupos de números (inclusive dígitos isolados)
    const grupos = texto.match(/\d+/g) || [];
    return grupos.join('');
  }

  // Função para processar código detectado
  const processDetectedCode = (code) => {
    // NOVO: usar extração refinada
    const cleanCode = extrairLinhaDigitavel(code);
    console.log('Código detectado:', cleanCode, 'Comprimento:', cleanCode.length);
    
    if ([47, 48].includes(cleanCode.length)) {
      setSuccess('Código de barras válido detectado!');
      setStatus('Processando...');
      setIsScanning(false);
      setTimeout(() => {
        onScan(cleanCode);
        onClose();
      }, 1000);
    } else {
      setError(`Leitura incompleta (${cleanCode.length} dígitos). Ajuste o enquadramento e tente novamente.`);
      setStatus('Aguardando código válido...');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Função para verificar se o ambiente suporta câmera
  const checkCameraSupport = () => {
    const isHTTPS = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168.');
    
    if (!isHTTPS && !isLocalhost) {
      return {
        supported: false,
        error: 'Câmera só funciona em HTTPS ou localhost. Use HTTPS ou teste localmente.'
      };
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        error: 'Seu navegador não suporta acesso à câmera. Use um navegador moderno.'
      };
    }

    return { supported: true };
  };

  // Inicializar scanner
  useEffect(() => {
    if (!isOpen || mode !== 'camera') return;

    setError('');
    setSuccess('');
    setStatus('Verificando ambiente...');
    setIsScanning(false);
    setCameraError('');
    setShowFallback(false);

    const initScanner = async () => {
      try {
        // Verificar suporte à câmera
        const cameraCheck = checkCameraSupport();
        if (!cameraCheck.supported) {
          setCameraError(cameraCheck.error);
          setShowFallback(true);
          setStatus('Câmera não disponível');
          return;
        }

        setStatus('Inicializando ZXing...');

        // Verificar se ZXing está disponível
        if (typeof BrowserMultiFormatReader === 'undefined') {
          throw new Error('Biblioteca ZXing não carregada. Recarregue a página.');
        }

        // Configurar ZXing
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.ITF,        // Interleaved 2 of 5 (comum em boletos)
          BarcodeFormat.CODE_128,   // Code 128
          BarcodeFormat.CODE_39,    // Code 39
          BarcodeFormat.EAN_13,     // EAN-13
          BarcodeFormat.EAN_8,      // EAN-8
          BarcodeFormat.UPC_A,      // UPC-A
          BarcodeFormat.UPC_E       // UPC-E
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.PURE_BARCODE, false);

        const newReader = new BrowserMultiFormatReader(hints, 5000);
        setReader(newReader);

        setStatus('Procurando câmeras...');

        // Listar câmeras disponíveis (com fallback)
        let deviceId = null;
        let devices = [];
        if (typeof newReader.listVideoInputDevices === 'function') {
          devices = await newReader.listVideoInputDevices();
          console.log('Câmeras disponíveis:', devices);
          if (devices && devices.length > 0) {
            const backCamera = devices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('traseira') ||
              device.label.toLowerCase().includes('environment') ||
              device.label.toLowerCase().includes('rear')
            );
            deviceId = backCamera ? backCamera.deviceId : devices[0]?.deviceId;
          }
        }
        // Fallback: se não existe listVideoInputDevices, tenta getUserMedia direto
        if (!deviceId) {
          setStatus('Tentando abrir a câmera padrão...');
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
            }
            setStatus('Câmera aberta. Aguardando código de barras...');
            // Não conseguimos usar ZXing para decodificar sem deviceId, então só mostramos a imagem
            setCameraError('Seu navegador não suporta leitura automática neste modo. Use o modo Imagem ou digite manualmente.');
            setShowFallback(true);
            return;
          } catch (e) {
            setCameraError('Não foi possível acessar a câmera. Permita o acesso ou tente outro navegador.');
            setShowFallback(true);
            return;
          }
        }

        setStatus('Iniciando câmera...');

        // Iniciar decodificação
        await newReader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (result && !isScanning) {
              setIsScanning(true);
              processDetectedCode(result.getText());
            }
            
            if (err && err.name !== 'NotFoundException') {
              console.error('Erro na leitura:', err);
              // Não mostrar erro de NotFoundException (normal durante busca)
              if (err.name !== 'NotFoundException') {
                setError(`Erro na leitura: ${err.message}`);
              }
            }
          }
        );

        setStatus('Aguardando código de barras...');
      } catch (err) {
        console.error('Erro ao inicializar scanner:', err);
        setCameraError(`Erro ao inicializar: ${err.message}`);
        setShowFallback(true);
        setStatus('Erro na inicialização');
      }
    };

    initScanner();

    // Cleanup
    return () => {
      if (reader) {
        try {
          reader.reset();
        } catch (e) {
          console.error('Erro ao resetar reader:', e);
        }
      }
    };
  }, [isOpen, mode]);

  // Upload de imagem
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setStatus('Processando imagem...');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.ITF,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const imageReader = new BrowserMultiFormatReader(hints, 5000);
        const result = await imageReader.decodeFromImageUrl(ev.target.result);
        
        if (result) {
          processDetectedCode(result.getText());
        } else {
          setError('Não foi possível ler o código de barras na imagem. Tente com melhor iluminação e foco.');
          setStatus('Aguardando nova imagem...');
        }
      } catch (err) {
        console.error('Erro ao processar imagem:', err);
        setError('Não foi possível processar a imagem. Verifique se há um código de barras visível.');
        setStatus('Aguardando nova imagem...');
      }
    };
    reader.readAsDataURL(file);
  };

  // Entrada manual
  const handleManualInput = () => {
    const code = prompt('Digite o código de barras manualmente (somente números):');
    if (code) {
      const cleanCode = extrairLinhaDigitavel(code);
      if ([47, 48].includes(cleanCode.length)) {
        onScan(cleanCode);
        onClose();
      } else {
        alert(`Código inválido. Deve ter 47 ou 48 números. (Digitado: ${cleanCode.length})`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Leitor de Código de Barras</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modo de leitura */}
        <div className="flex justify-center gap-2 mt-2 mb-2">
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition ${
              mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setMode('camera')}
            disabled={isIOSorSafari}
          >
            <Camera className="w-4 h-4" /> Câmera
          </button>
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition ${
              mode === 'image' || isIOSorSafari ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setMode('image')}
            autoFocus={isIOSorSafari}
          >
            <Upload className="w-4 h-4" /> Imagem
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

          {cameraError && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-orange-600" />
              <span className="text-orange-700 text-sm">{cameraError}</span>
            </div>
          )}

          {/* Aviso especial para iOS/Safari */}
          {isIOSorSafari && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-700 text-sm">
                Atenção: Em iPhone/iPad ou Safari, a leitura automática pode não funcionar. Use o modo <b>Imagem</b> para tirar uma foto do boleto ou digite manualmente.
              </span>
            </div>
          )}

          <div className="text-center mb-4">
            <p className="text-gray-700 text-base font-medium mb-1">
              Aponte a câmera para o <b>código de barras do boleto</b>
            </p>
            <p className="text-xs text-gray-500 mb-2">
              A linha digitável deve conter <b>entre 44 e 48 números</b>
            </p>
            <div className="flex items-center justify-center mb-2">
              <span className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1 animate-pulse">
                {status}
              </span>
            </div>
          </div>

          {/* Scanner Container */}
          {mode === 'camera' && !showFallback && (
            <div className="relative flex items-center justify-center mb-4">
              <div 
                ref={videoRef} 
                className="w-full h-64 rounded-lg overflow-hidden border-2 border-blue-500"
                style={{ 
                  background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
              />
              {/* Quadro de alinhamento */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-blue-500 w-4/5 h-16 rounded-lg bg-blue-500 bg-opacity-10"></div>
              </div>
            </div>
          )}

          {mode === 'camera' && showFallback && (
            <div className="text-center py-8">
              <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Câmera não disponível</p>
              <p className="text-sm text-gray-500 mb-4">
                Use uma das opções alternativas abaixo
              </p>
            </div>
          )}

          {mode === 'image' && (
            <div className="flex flex-col items-center gap-2 py-6">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handleImageUpload} 
                className="mb-2" 
              />
              <span className="text-xs text-gray-500">
                Selecione uma foto nítida do código de barras
              </span>
            </div>
          )}

          {/* Botão de entrada manual */}
          <button
            onClick={handleManualInput}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition mb-4"
          >
            Digitar código manualmente
          </button>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 text-sm mb-2">Dicas para melhor leitura:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Mantenha o código bem iluminado</li>
              <li>• Alinhe o código dentro da área azul</li>
              <li>• Evite reflexos e sombras</li>
              <li>• Mantenha o dispositivo estável</li>
              <li>• Aproxime até o código ficar nítido</li>
              {!window.location.protocol.includes('https') && window.location.hostname !== 'localhost' && (
                <li>• <strong>Use HTTPS para melhor compatibilidade</strong></li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleBarcodeScanner; 