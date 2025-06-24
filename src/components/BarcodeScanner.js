import React, { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';
import { X, Camera, AlertCircle, CheckCircle, Upload } from 'lucide-react';

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState('Aguardando código de barras...');
  const [mode, setMode] = useState('camera'); // camera | image
  const [scannedResults, setScannedResults] = useState([]); // Armazenar múltiplas leituras para verificação

  useEffect(() => {
    if (!isOpen || mode !== 'camera') return;
    setError('');
    setSuccess('');
    setStatus('Aguardando código de barras...');
    setScannedResults([]);

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: scannerRef.current,
        constraints: {
          facingMode: 'environment',
          width: { min: 800 },
          height: { min: 600 },
          aspectRatio: { min: 1, max: 2 },
          focusMode: 'continuous'
        },
        area: {
          top: '20%',
          right: '10%',
          left: '10%',
          bottom: '20%'
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      decoder: {
        readers: [
          'code_128_reader',
          'i2of5_reader',
          'ean_reader',
          'ean_8_reader',
          'code_39_reader',
          'code_93_reader',
          'codabar_reader'
        ],
        multiple: false,
        debug: {
          drawBoundingBox: true,
          showFrequency: true,
          drawScanline: true,
          showPattern: true
        },
        // Aumentar a tolerância para melhorar a detecção
        readers: [{
          format: "i2of5_reader",
          config: {
            normalizeBarSpaceWidth: true
          }
        }, {
          format: "code_128_reader",
          config: {
            normalizeBarSpaceWidth: true
          }
        }]
      },
      locate: true,
      frequency: 5,
      numOfWorkers: navigator.hardwareConcurrency || 4,
    }, (err) => {
      if (err) {
        setError('Erro ao inicializar câmera: ' + err.message);
        return;
      }
      Quagga.start();
    });

    Quagga.onProcessed(function(result) {
      const drawingCtx = Quagga.canvas.ctx.overlay;
      const drawingCanvas = Quagga.canvas.dom.overlay;

      if (result) {
        if (result.boxes) {
          drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
          result.boxes.filter(function(box) {
            return box !== result.box;
          }).forEach(function(box) {
            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
          });
        }

        if (result.box) {
          Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 });
        }

        if (result.codeResult && result.codeResult.code) {
          Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
        }
      }
    });

    Quagga.onDetected(onDetected);

    return () => {
      Quagga.offProcessed();
      Quagga.offDetected(onDetected);
      Quagga.stop();
    };
    // eslint-disable-next-line
  }, [isOpen, mode]);

  // Upload de imagem
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setSuccess('');
    setStatus('Processando imagem...');
    const reader = new FileReader();
    reader.onload = function(ev) {
      Quagga.decodeSingle({
        src: ev.target.result,
        numOfWorkers: 4,
        locate: true,
        inputStream: {
          size: 1200  // Aumentar tamanho para melhor resolução
        },
        decoder: {
          readers: [
            'code_128_reader',
            'i2of5_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'code_93_reader',
            'codabar_reader'
          ],
          debug: {
            drawBoundingBox: true,
            showFrequency: true,
            drawScanline: true,
            showPattern: true
          },
          multiple: false
        }
      }, function(result) {
        if (result && result.codeResult && result.codeResult.code) {
          const code = result.codeResult.code.replace(/\D/g, '');
          console.log("Código detectado na imagem:", code, "Comprimento:", code.length);
          
          if (code.length >= 44 && code.length <= 48) {
            setSuccess('Código de barras lido com sucesso!');
            setStatus('Código válido!');
            setTimeout(() => {
              onScan(code);
              onClose();
            }, 1000);
          } else {
            setError(`Código inválido (${code.length} dígitos). A linha digitável deve ter entre 44 e 48 números.`);
            setStatus('Aguardando código de barras...');
            setTimeout(() => setError(''), 3000);
          }
        } else {
          setError('Não foi possível ler o código de barras na imagem. Tente outra foto com melhor iluminação e foco.');
          setStatus('Aguardando código de barras...');
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const onDetected = (data) => {
    if (data && data.codeResult && data.codeResult.code) {
      const code = data.codeResult.code.replace(/\D/g, '');
      console.log("Código detectado:", code, "Comprimento:", code.length, "Confiança:", data.codeResult.confidence);
      
      // Verificar se o código tem o comprimento correto
      if (code.length >= 44 && code.length <= 48) {
        // Adicionar ao array de resultados
        setScannedResults(prev => {
          const newResults = [...prev, code];
          
          // Se temos pelo menos 2 leituras, verificamos se há consistência
          if (newResults.length >= 2) {
            // Verificar se o último código lido é igual ao anterior
            if (newResults[newResults.length - 1] === newResults[newResults.length - 2]) {
              setSuccess('Código de barras confirmado!');
              setStatus('Código válido!');
              
              // Pequena pausa para mostrar o sucesso antes de fechar
              setTimeout(() => {
                onScan(code);
                onClose();
              }, 800);
            } else {
              // Se não for igual, continuar lendo
              setStatus('Código detectado! Confirmando...');
            }
          } else {
            setStatus('Código detectado! Aguardando confirmação...');
          }
          
          // Manter apenas os últimos 3 resultados
          return newResults.slice(-3);
        });
      } else {
        setError(`Código inválido (${code.length} dígitos). A linha digitável deve ter entre 44 e 48 números.`);
        setStatus('Aguardando código de barras válido...');
        setTimeout(() => setError(''), 2000);
      }
    }
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
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modo de leitura */}
        <div className="flex justify-center gap-2 mt-2 mb-2">
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition ${mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setMode('camera')}
          >
            <Camera className="w-4 h-4" /> Câmera
          </button>
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition ${mode === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setMode('image')}
          >
            <Upload className="w-4 h-4" /> Imagem
          </button>
        </div>

        {/* Content */}
        <div className="p-4 pt-2">
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
              A linha digitável deve conter <b>entre 44 e 48 números</b>.
            </p>
            <p className="text-xs text-blue-700 mb-2">
              Dica: Evite sombras e aproxime até o código ficar nítido.
            </p>
            <div className="flex items-center justify-center mb-2">
              <span className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1 animate-pulse">{status}</span>
            </div>
          </div>

          {/* Scanner Container */}
          {mode === 'camera' && (
            <div className="relative flex items-center justify-center" style={{ minHeight: 280 }}>
              <div ref={scannerRef} style={{ width: '100%', height: 280, position: 'relative', overflow: 'hidden', borderRadius: 16, border: '3px solid #2563eb', boxShadow: '0 0 0 4px rgba(37,99,235,0.15)', filter: 'contrast(1.2)' }} />
            </div>
          )}
          {mode === 'image' && (
            <div className="flex flex-col items-center gap-2 py-6">
              <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="mb-2" />
              <span className="text-xs text-gray-500">Selecione uma foto nítida do código de barras do boleto</span>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 text-sm mb-2">Dicas para melhor leitura:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Mantenha o código de barras bem iluminado</li>
              <li>• Alinhe o código horizontalmente dentro da área azul</li>
              <li>• Evite reflexos e sombras</li>
              <li>• Mantenha o dispositivo estável</li>
              <li>• Aproxime até o código ficar nítido</li>
              <li>• Se não conseguir, tente a opção "Imagem"</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
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