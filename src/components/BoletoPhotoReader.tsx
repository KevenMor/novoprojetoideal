"use client";
import { useState } from "react";
import { 
  BrowserBarcodeReader, 
  ITFReader, 
  DecodeHintType, 
  BarcodeFormat,
  Code128Reader,
  Code39Reader
} from "@zxing/library";

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

// Função para tentar extrair números de uma string
function extrairNumeros(texto: string): string {
  return texto.replace(/\D/g, '');
}

// Função para validar se o texto parece uma linha digitável
function pareceLinhaDigitavel(texto: string): boolean {
  const numeros = extrairNumeros(texto);
  return numeros.length >= 44 && numeros.length <= 48;
}

export default function BoletoPhotoReader({ onDetect, onError }: BoletoPhotoReaderProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  async function handleSnap(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setPreview(URL.createObjectURL(file));
    setDebugInfo([]);

    try {
      // draw to canvas to keep EXIF-correct orientation
      const bmp = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bmp, 0, 0);
      
      // Tentar diferentes processamentos de imagem
      const processamentos = [
        { quality: 0.9, rotation: 0 },
        { quality: 0.8, rotation: 0 },
        { quality: 0.9, rotation: 90 },
        { quality: 0.9, rotation: 180 },
        { quality: 0.9, rotation: 270 }
      ];

      for (const proc of processamentos) {
        const canvasProcessado = document.createElement("canvas");
        const ctxProcessado = canvasProcessado.getContext("2d")!;
        
        if (proc.rotation === 0) {
          canvasProcessado.width = bmp.width;
          canvasProcessado.height = bmp.height;
          ctxProcessado.drawImage(bmp, 0, 0);
        } else {
          // Rotacionar imagem
          const rad = (proc.rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          
          canvasProcessado.width = Math.abs(bmp.width * cos) + Math.abs(bmp.height * sin);
          canvasProcessado.height = Math.abs(bmp.width * sin) + Math.abs(bmp.height * cos);
          
          ctxProcessado.translate(canvasProcessado.width / 2, canvasProcessado.height / 2);
          ctxProcessado.rotate(rad);
          ctxProcessado.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
        }
        
        const dataUrl = canvasProcessado.toDataURL("image/jpeg", proc.quality);
        const debugMsg = `Processamento: qualidade ${proc.quality}, rotação ${proc.rotation}°`;
        console.log(debugMsg);
        setDebugInfo(prev => [...prev, debugMsg]);
        
        const linha = await decodeOffline(dataUrl);
        if (linha) {
          setLoading(false);
          onDetect(linha.replace(/\D/g, ""));
          navigator.vibrate?.(50);
          return;
        }
      }
      
      setLoading(false);
      const errorMsg = "Não foi possível ler o código de barras. Verifique se a foto está bem iluminada e o código está visível.";
      onError ? onError(errorMsg) : alert(errorMsg);
      
    } catch (error) {
      setLoading(false);
      console.error('Erro ao processar foto:', error);
      const errorMsg = "Erro ao processar a foto. Tente novamente.";
      onError ? onError(errorMsg) : alert(errorMsg);
    }
  }

  async function decodeOffline(url: string): Promise<string | null> {
    // Configurações de decodificação - menos restritivas
    const configs = [
      // Configuração 1: ITF com hints relaxados
      {
        reader: new ITFReader(),
        hints: new Map([
          [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.ITF]],
          [DecodeHintType.TRY_HARDER, true],
          [DecodeHintType.PURE_BARCODE, false],
          [DecodeHintType.NEED_RESULT_POINT_CALLBACK, false]
        ])
      },
      // Configuração 2: Code128 (comum em boletos)
      {
        reader: new Code128Reader(),
        hints: new Map([
          [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]],
          [DecodeHintType.TRY_HARDER, true],
          [DecodeHintType.PURE_BARCODE, false]
        ])
      },
      // Configuração 3: Code39
      {
        reader: new Code39Reader(),
        hints: new Map([
          [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_39]],
          [DecodeHintType.TRY_HARDER, true],
          [DecodeHintType.PURE_BARCODE, false]
        ])
      },
      // Configuração 4: Múltiplos formatos
      {
        reader: new BrowserBarcodeReader(),
        hints: new Map([
          [DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.ITF,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E
          ]],
          [DecodeHintType.TRY_HARDER, true],
          [DecodeHintType.PURE_BARCODE, false]
        ])
      }
    ];

    for (const config of configs) {
      try {
        const readerName = config.reader.constructor.name;
        console.log(`Tentando decodificação com ${readerName}...`);
        setDebugInfo(prev => [...prev, `Tentando ${readerName}...`]);
        
        const reader = new BrowserBarcodeReader(1000, config.reader);
        reader.setHints(config.hints);

        const result = await reader.decodeFromImageUrl(url);
        const txt = result.getText();
        
        console.log(`${readerName} detectou:`, txt);
        setDebugInfo(prev => [...prev, `${readerName}: "${txt}"`]);
        
        // Se parece uma linha digitável, validar
        if (pareceLinhaDigitavel(txt)) {
          const linhaLimpa = extrairNumeros(txt);
          if (validaLinhaDigitavel(linhaLimpa)) {
            console.log('Linha digitável válida encontrada:', linhaLimpa);
            setDebugInfo(prev => [...prev, `✅ Válida: ${linhaLimpa}`]);
            return linhaLimpa;
          } else {
            console.log('Linha digitável inválida (falha na validação):', linhaLimpa);
            setDebugInfo(prev => [...prev, `⚠️ Inválida: ${linhaLimpa}`]);
            // Retornar mesmo assim se tiver o comprimento correto
            if (linhaLimpa.length >= 44 && linhaLimpa.length <= 48) {
              console.log('Retornando linha sem validação rigorosa:', linhaLimpa);
              setDebugInfo(prev => [...prev, `✅ Aceita sem validação: ${linhaLimpa}`]);
              return linhaLimpa;
            }
          }
        }
        
        // Se não parece linha digitável, mas tem muitos números, pode ser um código de barras
        const numeros = extrairNumeros(txt);
        if (numeros.length >= 44 && numeros.length <= 48) {
          console.log('Código numérico encontrado (sem validação):', numeros);
          setDebugInfo(prev => [...prev, `✅ Código numérico: ${numeros}`]);
          return numeros;
        }
        
      } catch (error) {
        const readerName = config.reader.constructor.name;
        console.log(`${readerName} falhou:`, error);
        setDebugInfo(prev => [...prev, `❌ ${readerName} falhou`]);
        continue;
      }
    }
    
    console.log('Nenhuma decodificação funcionou');
    setDebugInfo(prev => [...prev, '❌ Nenhuma decodificação funcionou']);
    return null;
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

      {/* Debug info */}
      {debugInfo.length > 0 && (
        <div className="mt-3 p-3 bg-gray-100 rounded-lg text-xs">
          <div className="font-semibold mb-2">Debug:</div>
          {debugInfo.map((info, index) => (
            <div key={index} className="text-gray-700">{info}</div>
          ))}
        </div>
      )}
    </div>
  );
} 