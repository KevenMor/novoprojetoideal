import React, { useRef, useState } from 'react';

interface UploadBoletoProps {
  onDetect: (linha: string) => void;
}

export default function UploadBoleto({ onDetect }: UploadBoletoProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linhaManual, setLinhaManual] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
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

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="block font-medium mb-1">Enviar foto do boleto</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          onChange={handleFileChange}
          disabled={loading}
        />
      </label>
      {preview && (
        <div className="flex flex-col items-center">
          <img src={preview} alt="Preview boleto" className="max-w-xs rounded shadow border" />
        </div>
      )}
      {loading && <div className="text-blue-600 text-sm">Processando imagem...</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
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