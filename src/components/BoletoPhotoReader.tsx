"use client";
import { useState } from "react";
import { BrowserBarcodeReader, ITFReader, DecodeHintType, BarcodeFormat } from "@zxing/library";

interface BoletoPhotoReaderProps {
  onDetect: (linha: string) => void;
  onError?: (message: string) => void;
}

// Função para validar linha digitável com módulo 10 e 11
function validaLinhaDigitavel(linha: string): boolean {
  linha = linha.replace(/\D/g, '');
  if (linha.length !== 47 && linha.length !== 48) return false;
  
  // Blocos
  const b1 = linha.slice(0, 9), dv1 = Number(linha[9]);
  const b2 = linha.slice(10, 20), dv2 = Number(linha[20]);
  const b3 = linha.slice(21, 31), dv3 = Number(linha[31]);
  
  // Validação módulo 10 dos blocos
  function modulo10(num: string): number {
    let soma = 0, mult = 2;
    for (let i = num.length - 1; i >= 0; i--) {
      let res = Number(num[i]) * mult;
      if (res > 9) res = 1 + (res - 10);
      soma += res;
      mult = mult === 2 ? 1 : 2;
    }
    return (10 - (soma % 10)) % 10;
  }
  
  if (modulo10(b1) !== dv1) return false;
  if (modulo10(b2) !== dv2) return false;
  if (modulo10(b3) !== dv3) return false;
  
  // DV geral (posição 32)
  const campo4 = Number(linha[32]);
  const barra = linha.slice(0, 4) + linha.slice(32, 47);
  
  function modulo11(num: string): number {
    let soma = 0, peso = 2;
    for (let i = num.length - 1; i >= 0; i--) {
      soma += Number(num[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    if (resto === 0 || resto === 1) return 1;
    if (resto === 10) return 1;
    return 11 - resto;
  }
  
  return modulo11(barra) === campo4;
}

export default function BoletoPhotoReader({ onDetect, onError }: BoletoPhotoReaderProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>();

  async function handleSnap(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setPreview(URL.createObjectURL(file));

    try {
      // draw to canvas to keep EXIF-correct orientation
      const bmp = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bmp, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      const linha = await decodeOffline(dataUrl);
      setLoading(false);

      if (linha) {
        onDetect(linha.replace(/\D/g, ""));
        navigator.vibrate?.(50);
      } else {
        const errorMsg = "Não foi possível ler o código de barras. Tire uma nova foto mais nítida.";
        onError ? onError(errorMsg) : alert(errorMsg);
      }
    } catch (error) {
      setLoading(false);
      console.error('Erro ao processar foto:', error);
      const errorMsg = "Erro ao processar a foto. Tente novamente.";
      onError ? onError(errorMsg) : alert(errorMsg);
    }
  }

  async function decodeOffline(url: string): Promise<string | null> {
    try {
      // Configuração robusta do ZXing
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.ITF]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.PURE_BARCODE, false);

      const reader = new BrowserBarcodeReader(500, new ITFReader());
      reader.setHints(hints);

      const result = await reader.decodeFromImageUrl(url);
      const txt = result.getText();
      
      console.log('ZXing detectou:', txt);
      
      return validaLinhaDigitavel(txt) ? txt : null;
    } catch (error) {
      console.log('ZXing falhou:', error);
      return null;
    }
  }

  return (
    <div className="space-y-3">
      <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-base cursor-pointer block text-center transition-colors">
        📷 Enviar foto do boleto
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleSnap}
          disabled={loading}
        />
      </label>

      {loading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Analisando foto...</p>
        </div>
      )}
      
      {preview && (
        <div className="text-center">
          <img 
            src={preview} 
            alt="Preview do boleto" 
            className="max-w-full max-h-48 object-contain rounded-lg border border-gray-300 mx-auto" 
          />
        </div>
      )}
    </div>
  );
} 