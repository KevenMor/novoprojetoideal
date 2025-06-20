const { initializeApp } = require('firebase/app');
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

async function limparFuncionarios() {
  try {
    console.log('Iniciando limpeza da coleção de funcionários...');
    
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Buscar todos os documentos
    const funcionariosRef = collection(db, 'funcionarios');
    const snapshot = await getDocs(funcionariosRef);
    
    console.log(`Encontrados ${snapshot.size} documentos para excluir.`);
    
    // Excluir cada documento
    const promises = snapshot.docs.map(async (documento) => {
      console.log(`Excluindo documento ${documento.id}...`);
      await deleteDoc(doc(db, 'funcionarios', documento.id));
      return documento.id;
    });
    
    // Aguardar todas as exclusões
    const resultados = await Promise.all(promises);
    
    console.log('Limpeza concluída!');
    console.log('Documentos excluídos:', resultados);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao limpar funcionários:', error);
    process.exit(1);
  }
}

// Executar limpeza
limparFuncionarios(); 