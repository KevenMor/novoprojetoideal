// Script para debugar erro específico da câmera
console.log('🔍 DEBUGANDO ERRO DA CÂMERA');
console.log('============================');

// Verificar ambiente
console.log('\n📱 INFORMAÇÕES DO AMBIENTE:');
console.log('User Agent:', navigator.userAgent);
console.log('Protocolo:', window.location.protocol);
console.log('Host:', window.location.host);
console.log('URL completa:', window.location.href);

// Verificar suporte à câmera
console.log('\n📷 VERIFICANDO SUPORTE À CÂMERA:');
console.log('navigator.mediaDevices existe:', !!navigator.mediaDevices);
console.log('navigator.mediaDevices.getUserMedia existe:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));

if (navigator.mediaDevices) {
  console.log('mediaDevices.keys():', Object.keys(navigator.mediaDevices));
}

// Verificar se está em HTTPS
const isHTTPS = window.location.protocol === 'https:';
console.log('Está em HTTPS:', isHTTPS);

if (!isHTTPS) {
  console.log('❌ PROBLEMA: Câmera só funciona em HTTPS!');
  console.log('💡 SOLUÇÃO: Use HTTPS ou localhost para desenvolvimento');
}

// Verificar se é localhost (que permite câmera sem HTTPS)
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.includes('192.168.');
console.log('É localhost:', isLocalhost);

// Testar acesso básico à câmera
async function testCameraAccess() {
  console.log('\n🎥 TESTANDO ACESSO À CÂMERA:');
  
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('API de mídia não suportada');
    }

    console.log('Solicitando permissão de câmera...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    console.log('✅ Permissão concedida!');
    console.log('Tracks:', stream.getTracks().map(track => ({
      kind: track.kind,
      label: track.label,
      enabled: track.enabled,
      readyState: track.readyState
    })));
    
    // Parar o stream
    stream.getTracks().forEach(track => track.stop());
    console.log('Stream parado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao acessar câmera:', error);
    console.error('Nome do erro:', error.name);
    console.error('Mensagem:', error.message);
    
    if (error.name === 'NotAllowedError') {
      console.log('💡 SOLUÇÃO: Permissão negada. Clique em "Permitir" quando solicitado.');
    } else if (error.name === 'NotFoundError') {
      console.log('💡 SOLUÇÃO: Nenhuma câmera encontrada. Verifique se o dispositivo tem câmera.');
    } else if (error.name === 'NotSupportedError') {
      console.log('💡 SOLUÇÃO: Navegador não suporta câmera.');
    } else if (error.name === 'NotReadableError') {
      console.log('💡 SOLUÇÃO: Câmera está sendo usada por outro aplicativo.');
    } else if (error.name === 'OverconstrainedError') {
      console.log('💡 SOLUÇÃO: Configuração de câmera não suportada.');
    } else if (error.name === 'TypeError') {
      console.log('💡 SOLUÇÃO: Parâmetros inválidos.');
    } else if (error.name === 'AbortError') {
      console.log('💡 SOLUÇÃO: Solicitação cancelada.');
    }
  }
}

// Testar listagem de dispositivos
async function testDeviceList() {
  console.log('\n📋 TESTANDO LISTAGEM DE DISPOSITIVOS:');
  
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new Error('API de enumeração não suportada');
    }

    console.log('Solicitando lista de dispositivos...');
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    console.log('Dispositivos de vídeo encontrados:', videoDevices.length);
    
    videoDevices.forEach((device, index) => {
      console.log(`Câmera ${index + 1}:`, {
        deviceId: device.deviceId,
        label: device.label || 'Sem label',
        groupId: device.groupId
      });
    });
    
    if (videoDevices.length === 0) {
      console.log('❌ Nenhuma câmera encontrada!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao listar dispositivos:', error);
  }
}

// Verificar biblioteca ZXing
console.log('\n📚 VERIFICANDO BIBLIOTECA ZXING:');
try {
  // Tentar importar ZXing (se estiver disponível)
  if (typeof window !== 'undefined') {
    console.log('ZXing Browser disponível:', !!window.ZXing);
    console.log('ZXing Library disponível:', !!window.ZXing?.library);
  }
} catch (error) {
  console.log('ZXing não disponível no contexto atual');
}

// Executar testes
console.log('\n🚀 EXECUTANDO TESTES...');

// Aguardar um pouco antes de executar os testes
setTimeout(async () => {
  await testDeviceList();
  await testCameraAccess();
  
  console.log('\n📊 RESUMO DOS PROBLEMAS POSSÍVEIS:');
  console.log('1. ❌ Não está em HTTPS (exceto localhost)');
  console.log('2. ❌ Permissão de câmera negada');
  console.log('3. ❌ Nenhuma câmera disponível');
  console.log('4. ❌ Câmera sendo usada por outro app');
  console.log('5. ❌ Navegador não suporta câmera');
  console.log('6. ❌ Biblioteca ZXing não carregada');
  console.log('7. ❌ Dispositivo sem câmera');
  
  console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
  console.log('1. Use HTTPS ou localhost');
  console.log('2. Conceda permissão de câmera');
  console.log('3. Feche outros apps que usam câmera');
  console.log('4. Use navegador moderno (Chrome, Firefox, Safari)');
  console.log('5. Verifique se o dispositivo tem câmera');
  console.log('6. Use modo "Imagem" como alternativa');
  console.log('7. Use entrada manual como fallback');
  
  console.log('\n✅ DEBUG CONCLUÍDO!');
}, 1000); 