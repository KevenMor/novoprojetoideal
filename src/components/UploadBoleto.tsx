import React, { useRef, useState } from 'react';
// @ts-ignore
import { Html5Qrcode } from 'html5-qrcode';

interface UploadBoletoProps {
  onDetect: (linha: string) => void;
}

export default function UploadBoleto({ onDetect }: UploadBoletoProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linhaManual, setLinhaManual] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const html5Qr = useRef<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    // Bloquear WebP
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Apenas imagens JPEG ou PNG são suportadas.');
      return;
    }
    setLoading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append('foto', file);
      const res = await fetch('/api/decode-boleto', {
        method: 'POST',
        body: formData,
      });
      if (res.status === 422) {
        setError('Não foi possível ler o código. Digite manualmente.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Erro ao processar imagem');
      const data = await res.json();
      if (data.linha) {
        onDetect(data.linha);
        setLinhaManual(data.linha);
      } else {
        setError('Não foi possível ler o código. Digite manualmente.');
      }
    } catch (err) {
      setError('Erro ao processar imagem. Digite manualmente.');
    }
    setLoading(false);
  };

  // QR Code Pix
  const handleOpenQr = async () => {
    setShowQr(true);
    setQrLoading(true);
    setError(null);
    setTimeout(() => startQr(), 300); // garantir render
  };
  const startQr = () => {
    if (!qrRef.current) return;
    html5Qr.current = new Html5Qrcode(qrRef.current.id);
    html5Qr.current.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      (decodedText: string) => {
        setQrLoading(false);
        setShowQr(false);
        html5Qr.current.stop();
        onDetect(decodedText);
        setLinhaManual(decodedText);
      },
      (err: any) => {}
    ).catch(() => {
      setError('Erro ao acessar câmera para QR Code.');
      setQrLoading(false);
      setShowQr(false);
    });
  };
  const handleCloseQr = () => {
    setShowQr(false);
    setQrLoading(false);
    if (html5Qr.current) html5Qr.current.stop();
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-700 bg-yellow-50 rounded p-2 mb-2">
        Envie uma foto nítida do boleto (JPEG/PNG, não WebP). Ou, se disponível, use o QR Code do Pix para leitura instantânea.
      </div>
      <div className="flex gap-2">
        <label className="block">
          <span className="block font-medium mb-1">Enviar foto do boleto</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={handleFileChange}
            disabled={loading}
          />
        </label>
        <button
          type="button"
          className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 text-sm h-fit mt-6"
          onClick={handleOpenQr}
          disabled={qrLoading}
        >
          Ler QR Code do boleto
        </button>
      </div>
      {preview && (
        <div className="flex flex-col items-center">
          <img src={preview} alt="Preview boleto" className="max-w-xs rounded shadow border" />
        </div>
      )}
      {loading && <div className="text-blue-600 text-sm">Processando imagem...</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {showQr && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">
          <div className="bg-white rounded-lg p-4 shadow-lg flex flex-col items-center">
            <div className="mb-2 text-gray-800 font-medium">Aponte a câmera para o QR Code do boleto/Pix</div>
            <div ref={qrRef} id="qr-reader" className="w-64 h-64" />
            <button onClick={handleCloseQr} className="mt-4 px-4 py-2 rounded bg-red-600 text-white">Fechar</button>
          </div>
        </div>
      )}
      <label className="block">
        <span className="block font-medium mb-1">Linha digitável</span>
        <input
          type="text"
          inputMode="numeric"
          className="input input-bordered w-full max-w-xs"
          value={linhaManual}
          onChange={e => {
            setLinhaManual(e.target.value.replace(/\D/g, ''));
            onDetect(e.target.value.replace(/\D/g, ''));
          }}
          placeholder="Digite a linha digitável"
          maxLength={48}
        />
      </label>
    </div>
  );
}
// Para usar: npm install html5-qrcode 