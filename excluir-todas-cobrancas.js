const admin = require('firebase-admin');
const serviceAccount = require('./server/config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function excluirTodasCobrancas() {
  const snapshot = await db.collection('cobrancas').get();
  if (snapshot.empty) {
    console.log('Nenhuma cobrança encontrada para excluir.');
    return;
  }
  let count = 0;
  for (const doc of snapshot.docs) {
    await doc.ref.delete();
    count++;
    console.log(`Excluída cobrança ID: ${doc.id}`);
  }
  console.log(`\nTotal de cobranças excluídas: ${count}`);
}

excluirTodasCobrancas().then(() => {
  console.log('✅ Exclusão concluída!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro ao excluir cobranças:', err);
  process.exit(1);
}); 