import { NextRequest, NextResponse } from 'next/server';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('foto');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
  }
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  // Redimensiona e converte para PNG
  const imageBuffer = await sharp(inputBuffer).resize({ width: 1200 }).png().toBuffer();

  // ZXing Node
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.ITF]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  const reader = new BrowserMultiFormatReader(hints);

  try {
    // Decodifica a imagem
    const result = await reader.decodeFromImage(undefined, imageBuffer);
    const linha = result.getText().replace(/\D/g, '');
    if (linha.length < 40) throw new Error('Linha digitável inválida');
    return NextResponse.json({ linha });
  } catch (e) {
    return NextResponse.json({ error: 'Não foi possível decodificar' }, { status: 422 });
  }
} 