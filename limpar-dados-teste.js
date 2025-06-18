const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBJGbAd_1HfYqwuBPXtCn45YTZM2iiBzQ8",
  authDomain: "sistema-ideal-dbffd.firebaseapp.com",
  projectId: "sistema-ideal-dbffd",
  storageBucket: "sistema-ideal-dbffd.firebasestorage.app",
  messagingSenderId: "1011080036176",
  appId: "1:1011080036176:web:d51b087f72bfa14dbb7655"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function limparDadosTeste() {
  try {
    console.log('🧹 LIMPANDO DADOS DE TESTE DO DASHBOARD');
    console.log('=====================================');
    
    // 1. Fazer login como admin
    console.log('🔐 Fazendo login como admin...');
    await signInWithEmailAndPassword(auth, 'admin@autoescolaideal.com', 'admin123');
    console.log('✅ Login realizado com sucesso!');
    
    // 2. Limpar mensagens de teste
    console.log('\n📧 Limpando mensagens de teste...');
    const mensagensSnapshot = await getDocs(collection(db, 'mensagens'));
    let mensagensRemovidas = 0;
    
    for (const docSnapshot of mensagensSnapshot.docs) {
      const data = docSnapshot.data();
      // Remover mensagens que são claramente de teste
      if (data.destinatario?.includes('undefined') || 
          data.mensagem?.includes('undefined') ||
          data.status === 'teste' ||
          !data.destinatario ||
          !data.mensagem) {
        await deleteDoc(doc(db, 'mensagens', docSnapshot.id));
        mensagensRemovidas++;
        console.log(`❌ Removida mensagem: ${data.destinatario || 'undefined'}`);
      }
    }
    console.log(`✅ ${mensagensRemovidas} mensagens de teste removidas`);
    
    // 3. Limpar contas BTG de teste
    console.log('\n💳 Limpando contas BTG de teste...');
    const contasSnapshot = await getDocs(collection(db, 'contas_btg'));
    let contasRemovidas = 0;
    
    for (const docSnapshot of contasSnapshot.docs) {
      const data = docSnapshot.data();
      // Remover contas que são claramente de teste
      if (data.nome?.includes('undefined') || 
          data.email?.includes('undefined') ||
          data.status === 'teste' ||
          !data.nome ||
          !data.email) {
        await deleteDoc(doc(db, 'contas_btg', docSnapshot.id));
        contasRemovidas++;
        console.log(`❌ Removida conta: ${data.nome || 'undefined'}`);
      }
    }
    console.log(`✅ ${contasRemovidas} contas BTG de teste removidas`);
    
    // 4. Limpar cobranças de teste
    console.log('\n🧾 Limpando cobranças de teste...');
    const cobrancasSnapshot = await getDocs(collection(db, 'cobrancas'));
    let cobrancasRemovidas = 0;
    
    for (const docSnapshot of cobrancasSnapshot.docs) {
      const data = docSnapshot.data();
      // Remover cobranças que são claramente de teste
      if (data.descricao?.includes('undefined') || 
          data.status === 'teste' ||
          data.valor === 150 || // Valores específicos de teste
          data.valor === 350 ||
          !data.descricao) {
        await deleteDoc(doc(db, 'cobrancas', docSnapshot.id));
        cobrancasRemovidas++;
        console.log(`❌ Removida cobrança: ${data.descricao || 'undefined'} - R$ ${data.valor || 0}`);
      }
    }
    console.log(`✅ ${cobrancasRemovidas} cobranças de teste removidas`);
    
    // 5. Limpar extratos de teste (se existirem)
    console.log('\n📊 Limpando extratos de teste...');
    try {
      const extratosSnapshot = await getDocs(collection(db, 'extratos'));
      let extratosRemovidos = 0;
      
      for (const docSnapshot of extratosSnapshot.docs) {
        const data = docSnapshot.data();
        if (data.tipo === 'teste' || data.descricao?.includes('teste')) {
          await deleteDoc(doc(db, 'extratos', docSnapshot.id));
          extratosRemovidos++;
          console.log(`❌ Removido extrato de teste`);
        }
      }
      console.log(`✅ ${extratosRemovidos} extratos de teste removidos`);
    } catch (error) {
      console.log('ℹ️ Coleção extratos não existe ou está vazia');
    }
    
    // 6. Resumo final
    console.log('\n🎯 RESUMO DA LIMPEZA:');
    console.log('====================');
    console.log(`📧 Mensagens removidas: ${mensagensRemovidas}`);
    console.log(`💳 Contas BTG removidas: ${contasRemovidas}`);
    console.log(`🧾 Cobranças removidas: ${cobrancasRemovidas}`);
    
    const totalRemovido = mensagensRemovidas + contasRemovidas + cobrancasRemovidas;
    
    if (totalRemovido > 0) {
      console.log(`\n✅ LIMPEZA CONCLUÍDA! ${totalRemovido} registros de teste removidos`);
      console.log('🔄 Atualize o dashboard para ver os dados limpos');
    } else {
      console.log('\n✨ DASHBOARD JÁ ESTÁ LIMPO! Nenhum dado de teste encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
  
  process.exit(0);
}

limparDadosTeste(); 