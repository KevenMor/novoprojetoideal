const codigoOriginal = "00190.00009 03104.249093 05028.854171 8 11510000006975";
const codigoLimpo = codigoOriginal.replace(/\D/g, '');

console.log('=== TESTE CÓDIGO DE BARRAS ===');
console.log('Original:', codigoOriginal);
console.log('Tamanho original:', codigoOriginal.length);
console.log('Limpo:', codigoLimpo);
console.log('Tamanho limpo:', codigoLimpo.length);
console.log('Dígitos esperados:', '00190000090310424909305028854171811510000006975');
console.log('Tamanho esperado:', '00190000090310424909305028854171811510000006975'.length);

// Verificar se há diferenças
if (codigoLimpo === '00190000090310424909305028854171811510000006975') {
  console.log('✅ Código processado corretamente!');
} else {
  console.log('❌ Problema no processamento!');
  console.log('Diferença:', codigoLimpo.length - '00190000090310424909305028854171811510000006975'.length, 'dígitos');
} 