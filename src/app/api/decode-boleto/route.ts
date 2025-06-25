import { NextRequest, NextResponse } from 'next/server';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

export const runtime = 'nodejs';

// Função para validar linha digitável
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

// Função para extrair números da imagem via OCR
async function extractNumbersFromImage(imageBuffer: Buffer): Promise<string | null> {
  try {
    console.log('Tentando OCR na imagem...');
    
    // Processar imagem para melhorar OCR
    const processedImage = await sharp(imageBuffer)
      .grayscale()
      .contrast(1.5)
      .sharpen()
      .png()
      .toBuffer();
    
    // Usar Tesseract.js para OCR
    const { data: { text } } = await Tesseract.recognize(processedImage, 'por', {
      logger: m => console.log('OCR:', m.status, m.progress)
    });
    
    console.log('Texto extraído via OCR:', text);
    
    // Extrair números da linha digitável com regex robusto
    const numberPatterns = [
      /\d{4}\s*\d{5}\s*\d{10}\s*\d{10}\s*\d{15}/, // Formato com espaços
      /\d{4}\.\d{5}\.\d{10}\.\d{10}\.\d{15}/,     // Formato com pontos
      /\d{47}/,                                    // Apenas números (47 dígitos)
      /\d{48}/,                                    // Apenas números (48 dígitos)
      /\d{4}[\s\.]?\d{5}[\s\.]?\d{10}[\s\.]?\d{10}[\s\.]?\d{15}/, // Formato flexível
    ];
    
    for (const pattern of numberPatterns) {
      const match = text.match(pattern);
      if (match) {
        const linha = match[0].replace(/\D/g, '');
        console.log('Padrão encontrado:', pattern, 'linha:', linha);
        
        if (linha.length >= 40 && validaLinhaDigitavel(linha)) {
          console.log('Linha válida encontrada via OCR:', linha);
          return linha;
        }
      }
    }
    
    // Se não encontrou padrão específico, tentar extrair sequência de números
    const allNumbers = text.match(/\d+/g);
    if (allNumbers) {
      const combinedNumbers = allNumbers.join('');
      console.log('Números extraídos:', combinedNumbers);
      
      // Procurar por sequências de 47-48 dígitos
      for (let i = 0; i <= combinedNumbers.length - 47; i++) {
        const candidate = combinedNumbers.slice(i, i + 47);
        if (validaLinhaDigitavel(candidate)) {
          console.log('Linha válida encontrada em sequência:', candidate);
          return candidate;
        }
      }
      
      // Tentar com 48 dígitos
      for (let i = 0; i <= combinedNumbers.length - 48; i++) {
        const candidate = combinedNumbers.slice(i, i + 48);
        if (validaLinhaDigitavel(candidate)) {
          console.log('Linha válida encontrada em sequência (48):', candidate);
          return candidate;
        }
      }
    }
    
    console.log('OCR não encontrou linha válida');
    return null;
  } catch (error) {
    console.error('Erro no OCR:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('foto');
    
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    console.log('Processando arquivo:', file.name, 'tamanho:', file.size);
    
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Pré-processamento da imagem para melhorar detecção
    const processedImage = await sharp(inputBuffer)
      .resize({ width: 1500, withoutEnlargement: true }) // Redimensiona para 1500px
      .sharpen() // Melhora nitidez
      .contrast(1.2) // Aumenta contraste
      .png()
      .toBuffer();

    console.log('Imagem processada, tentando decodificar...');

    // Configuração robusta do ZXing
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.ITF,           // Interleaved 2 of 5
      BarcodeFormat.CODE_128,      // Code 128
      BarcodeFormat.CODE_39,       // Code 39
      BarcodeFormat.EAN_13,        // EAN-13
      BarcodeFormat.EAN_8,         // EAN-8
      BarcodeFormat.UPC_A,         // UPC-A
      BarcodeFormat.UPC_E          // UPC-E
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.PURE_BARCODE, false);
    hints.set(DecodeHintType.NEED_RESULT_POINT_CALLBACK, false);

    const reader = new BrowserMultiFormatReader(hints);

    try {
      // Tentativa 1: Decodificação direta
      console.log('Tentativa 1: Decodificação ZXing...');
      const result = await reader.decodeFromImage(undefined, processedImage);
      const linha = result.getText().replace(/\D/g, '');
      
      console.log('ZXing detectou:', linha);
      
      if (linha.length >= 40 && validaLinhaDigitavel(linha)) {
        console.log('Linha válida encontrada via ZXing:', linha);
        return NextResponse.json({ linha });
      }
      
      // Se ZXing detectou algo mas não é válido, tentar OCR
      if (linha.length >= 40) {
        console.log('ZXing detectou código inválido, tentando OCR...');
        const ocrResult = await extractNumbersFromImage(processedImage);
        if (ocrResult && validaLinhaDigitavel(ocrResult)) {
          console.log('Linha válida encontrada via OCR:', ocrResult);
          return NextResponse.json({ linha: ocrResult });
        }
      }
      
    } catch (zxingError) {
      console.log('ZXing falhou:', zxingError.message);
      
      // Tentativa 2: OCR como fallback
      console.log('Tentativa 2: OCR como fallback...');
      const ocrResult = await extractNumbersFromImage(processedImage);
      if (ocrResult && validaLinhaDigitavel(ocrResult)) {
        console.log('Linha válida encontrada via OCR:', ocrResult);
        return NextResponse.json({ linha: ocrResult });
      }
      
      // Tentativa 3: Processar imagem com diferentes configurações
      console.log('Tentativa 3: Processamento alternativo...');
      const alternativeImage = await sharp(inputBuffer)
        .resize({ width: 2000, withoutEnlargement: true })
        .grayscale()
        .contrast(1.5)
        .sharpen({ sigma: 2 })
        .png()
        .toBuffer();
      
      try {
        const result2 = await reader.decodeFromImage(undefined, alternativeImage);
        const linha2 = result2.getText().replace(/\D/g, '');
        
        console.log('ZXing (alternativo) detectou:', linha2);
        
        if (linha2.length >= 40 && validaLinhaDigitavel(linha2)) {
          console.log('Linha válida encontrada via ZXing alternativo:', linha2);
          return NextResponse.json({ linha: linha2 });
        }
      } catch (altError) {
        console.log('ZXing alternativo também falhou:', altError.message);
      }
      
      // Tentativa 4: OCR na imagem alternativa
      console.log('Tentativa 4: OCR na imagem alternativa...');
      const ocrResult2 = await extractNumbersFromImage(alternativeImage);
      if (ocrResult2 && validaLinhaDigitavel(ocrResult2)) {
        console.log('Linha válida encontrada via OCR alternativo:', ocrResult2);
        return NextResponse.json({ linha: ocrResult2 });
      }
    }

    console.log('Nenhuma decodificação bem-sucedida');
    return NextResponse.json({ 
      error: 'Não foi possível decodificar o código de barras. Verifique se a imagem está nítida e bem iluminada.' 
    }, { status: 422 });

  } catch (error) {
    console.error('Erro geral na API:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 