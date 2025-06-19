const admin = require('firebase-admin');
const serviceAccount = require('./server/config/serviceAccountKey.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function corrigirCobrancas() {
  console.log('🔧 Iniciando correção de cobranças...');
  
  try {
    // Buscar todas as cobranças
    const snapshot = await db.collection('cobrancas').get();
    console.log(`📊 Encontradas ${snapshot.size} cobranças`);
    
    let corrigidas = 0;
    let criadas = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates = {};
      
      // 1. Corrigir CPF (garantir que seja apenas números)
      if (data.cpf && typeof data.cpf === 'string') {
        const cpfLimpo = data.cpf.replace(/\D/g, '');
        if (cpfLimpo !== data.cpf) {
          updates.cpf = cpfLimpo;
          console.log(`📝 CPF corrigido para ${doc.id}: ${data.cpf} → ${cpfLimpo}`);
        }
      }
      
      // 2. Garantir que createdAt existe
      if (!data.createdAt) {
        updates.createdAt = data.dataCriacao || admin.firestore.Timestamp.now();
        console.log(`📅 createdAt adicionado para ${doc.id}`);
      }
      
      // 3. Garantir que dataCriacao existe
      if (!data.dataCriacao) {
        updates.dataCriacao = data.createdAt || admin.firestore.Timestamp.now();
        console.log(`📅 dataCriacao adicionado para ${doc.id}`);
      }
      
      // 4. Garantir que valorTotal seja número
      if (data.valorTotal && typeof data.valorTotal === 'string') {
        const valorNumerico = parseFloat(data.valorTotal.replace(',', '.'));
        if (!isNaN(valorNumerico)) {
          updates.valorTotal = valorNumerico.toFixed(2);
          console.log(`💰 Valor corrigido para ${doc.id}: ${data.valorTotal} → ${updates.valorTotal}`);
        }
      }
      
      // 5. Garantir que valorParcela seja número
      if (data.valorParcela && typeof data.valorParcela === 'string') {
        const valorNumerico = parseFloat(data.valorParcela.replace(',', '.'));
        if (!isNaN(valorNumerico)) {
          updates.valorParcela = valorNumerico.toFixed(2);
          console.log(`💰 Valor parcela corrigido para ${doc.id}: ${data.valorParcela} → ${updates.valorParcela}`);
        }
      }
      
      // 6. Garantir que parcelas seja número
      if (data.parcelas && typeof data.parcelas === 'string') {
        const parcelasNumerico = parseInt(data.parcelas);
        if (!isNaN(parcelasNumerico)) {
          updates.parcelas = parcelasNumerico;
          console.log(`📦 Parcelas corrigido para ${doc.id}: ${data.parcelas} → ${parcelasNumerico}`);
        }
      }
      
      // 7. Garantir que status seja válido
      if (!data.status) {
        updates.status = 'ENVIADO';
        console.log(`📊 Status adicionado para ${doc.id}: ENVIADO`);
      }
      
      // Aplicar atualizações se houver
      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        corrigidas++;
        console.log(`✅ Cobrança ${doc.id} corrigida`);
      }
    }
    
    console.log(`\n🎉 Correção concluída!`);
    console.log(`📊 Total de cobranças processadas: ${snapshot.size}`);
    console.log(`🔧 Cobranças corrigidas: ${corrigidas}`);
    
  } catch (error) {
    console.error('❌ Erro ao corrigir cobranças:', error);
  }
}

// Executar correção
corrigirCobrancas().then(() => {
  console.log('✅ Script finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no script:', error);
  process.exit(1);
}); 