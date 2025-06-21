// Script para debug do cálculo de saldo no dashboard
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Configuração do Firebase (use suas credenciais)
const firebaseConfig = {
  // Adicione sua configuração aqui
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugSaldoDashboard() {
  console.log('🔍 Iniciando debug do saldo do dashboard...');
  
  const unidades = ['Julio de Mesquita', 'Aparecidinha', 'Coop', 'Progresso', 'Vila Haro', 'Vila Helena'];
  
  let saldoTotalDashboard = 0;
  let totalRegistros = 0;
  
  for (const unidade of unidades) {
    console.log(`\n📊 Analisando unidade: ${unidade}`);
    
    try {
      // Buscar lançamentos manuais
      const lancamentosQuery = query(
        collection(db, 'lancamentos'),
        where('unidade', '==', unidade),
        where('ativo', '==', true)
      );
      const lancamentosSnapshot = await getDocs(lancamentosQuery);
      
      // Buscar contas BTG pagas
      const contasBTGQuery = query(
        collection(db, 'contas_btg'),
        where('unidade', '==', unidade),
        where('status', '==', 'PAGO')
      );
      const contasBTGSnapshot = await getDocs(contasBTGQuery);
      
      console.log(`  📝 Lançamentos manuais: ${lancamentosSnapshot.size}`);
      console.log(`  💳 Contas BTG pagas: ${contasBTGSnapshot.size}`);
      
      let saldoUnidade = 0;
      let receitasUnidade = 0;
      let despesasUnidade = 0;
      
      // Processar lançamentos manuais
      lancamentosSnapshot.forEach(doc => {
        const data = doc.data();
        const valor = data.valor || 0;
        const tipo = data.tipo;
        const status = (data.status || '').toLowerCase();
        
        // Filtrar excluídos
        if (status === 'excluido' || status === 'deleted') {
          console.log(`    ❌ Lançamento excluído: ${data.descricao} - R$ ${valor}`);
          return;
        }
        
        console.log(`    📄 ${data.descricao}: R$ ${valor} (${tipo})`);
        
        if (tipo === 'RECEITA' || tipo === 'CREDIT') {
          receitasUnidade += valor;
          saldoUnidade += valor;
        } else {
          despesasUnidade += valor;
          saldoUnidade -= valor;
        }
      });
      
      // Processar contas BTG pagas
      contasBTGSnapshot.forEach(doc => {
        const data = doc.data();
        const valor = Math.abs(data.valor || 0);
        
        console.log(`    💳 BTG ${data.descricao}: -R$ ${valor} (DESPESA)`);
        
        despesasUnidade += valor;
        saldoUnidade -= valor;
      });
      
      console.log(`  💰 Saldo da unidade: R$ ${saldoUnidade.toFixed(2)}`);
      console.log(`  📈 Receitas: R$ ${receitasUnidade.toFixed(2)}`);
      console.log(`  📉 Despesas: R$ ${despesasUnidade.toFixed(2)}`);
      
      saldoTotalDashboard += saldoUnidade;
      totalRegistros += lancamentosSnapshot.size + contasBTGSnapshot.size;
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${unidade}:`, error);
    }
  }
  
  console.log(`\n🎯 RESULTADO FINAL:`);
  console.log(`💰 Saldo total: R$ ${saldoTotalDashboard.toFixed(2)}`);
  console.log(`📊 Total de registros: ${totalRegistros}`);
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  debugSaldoDashboard().catch(console.error);
}

module.exports = { debugSaldoDashboard }; 