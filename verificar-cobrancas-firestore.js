const admin = require('firebase-admin');
const serviceAccount = require('./server/config/serviceAccountKey.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verificarCobrancas() {
  console.log('🔍 Verificando cobranças no Firestore...');
  
  try {
    // Buscar todas as cobranças
    const snapshot = await db.collection('cobrancas').get();
    console.log(`📊 Total de cobranças encontradas: ${snapshot.size}`);
    
    if (snapshot.size === 0) {
      console.log('⚠️ Nenhuma cobrança encontrada no Firestore');
      return;
    }
    
    let problemas = [];
    let statusCount = {};
    let unidadesCount = {};
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const id = doc.id;
      
      // Contar status
      const status = data.status || 'SEM_STATUS';
      statusCount[status] = (statusCount[status] || 0) + 1;
      
      // Contar unidades
      const unidade = data.unidade || 'SEM_UNIDADE';
      unidadesCount[unidade] = (unidadesCount[unidade] || 0) + 1;
      
      // Verificar problemas
      const problemasDoc = [];
      
      // 1. Verificar CPF
      if (!data.cpf) {
        problemasDoc.push('CPF ausente');
      } else if (typeof data.cpf === 'string' && data.cpf.includes('.')) {
        problemasDoc.push('CPF com formatação (deveria ser apenas números)');
      }
      
      // 2. Verificar campos obrigatórios
      if (!data.nome) problemasDoc.push('Nome ausente');
      if (!data.valorTotal && !data.valor) problemasDoc.push('Valor ausente');
      if (!data.dataVencimento) problemasDoc.push('Data de vencimento ausente');
      if (!data.unidade) problemasDoc.push('Unidade ausente');
      
      // 3. Verificar campos de data
      if (!data.createdAt && !data.dataCriacao) {
        problemasDoc.push('Campo de data de criação ausente');
      }
      
      // 4. Verificar tipos de dados
      if (data.valorTotal && typeof data.valorTotal === 'string' && data.valorTotal.includes(',')) {
        problemasDoc.push('Valor total como string com vírgula');
      }
      
      if (data.valorParcela && typeof data.valorParcela === 'string' && data.valorParcela.includes(',')) {
        problemasDoc.push('Valor parcela como string com vírgula');
      }
      
      if (data.parcelas && typeof data.parcelas === 'string') {
        problemasDoc.push('Parcelas como string (deveria ser número)');
      }
      
      // 5. Verificar status
      if (!data.status) {
        problemasDoc.push('Status ausente');
      }
      
      if (problemasDoc.length > 0) {
        problemas.push({
          id,
          nome: data.nome || 'SEM_NOME',
          cpf: data.cpf || 'SEM_CPF',
          problemas: problemasDoc
        });
      }
      
      // Mostrar detalhes das primeiras 5 cobranças
      if (index < 5) {
        console.log(`\n📋 Cobrança ${index + 1}:`);
        console.log(`   ID: ${id}`);
        console.log(`   Nome: ${data.nome || 'N/A'}`);
        console.log(`   CPF: ${data.cpf || 'N/A'}`);
        console.log(`   Status: ${data.status || 'N/A'}`);
        console.log(`   Valor: ${data.valorTotal || data.valor || 'N/A'}`);
        console.log(`   Unidade: ${data.unidade || 'N/A'}`);
        console.log(`   Data Vencimento: ${data.dataVencimento || 'N/A'}`);
        console.log(`   CreatedAt: ${data.createdAt ? 'Sim' : 'Não'}`);
        console.log(`   DataCriacao: ${data.dataCriacao ? 'Sim' : 'Não'}`);
      }
    });
    
    // Relatório final
    console.log('\n📊 RELATÓRIO GERAL:');
    console.log('==================');
    
    console.log('\n📈 Status das cobranças:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    console.log('\n🏢 Unidades:');
    Object.entries(unidadesCount).forEach(([unidade, count]) => {
      console.log(`   ${unidade}: ${count}`);
    });
    
    if (problemas.length > 0) {
      console.log(`\n⚠️ PROBLEMAS ENCONTRADOS (${problemas.length} cobranças):`);
      console.log('==========================================');
      problemas.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.nome} (${item.cpf})`);
        console.log(`   ID: ${item.id}`);
        item.problemas.forEach(problema => {
          console.log(`   ❌ ${problema}`);
        });
      });
      
      console.log(`\n💡 RECOMENDAÇÃO: Execute o script 'corrigir-cobrancas-historico.js' para corrigir automaticamente os problemas encontrados.`);
    } else {
      console.log('\n✅ Nenhum problema encontrado! Todas as cobranças estão com formato correto.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar cobranças:', error);
  }
}

// Executar verificação
verificarCobrancas().then(() => {
  console.log('\n✅ Verificação finalizada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro na verificação:', error);
  process.exit(1);
}); 