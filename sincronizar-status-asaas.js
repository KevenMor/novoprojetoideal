const admin = require('firebase-admin');
const serviceAccount = require('./server/config/serviceAccountKey.json');
const axios = require('axios');

const ASAAS_API_URL = 'https://www.asaas.com/api/v3';
const ASAAS_TOKEN = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjllOTQyMDJlLTc2ZmQtNGNkYS1iYjI0LWQxZGViMzE2NTNiOTo6JGFhY2hfYWQzNjAzYjgtZDFlZC00ZTY3LTkzMWQtOGE4Y2Q2NWZkNDk1';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function buscarStatusAsaas(paymentId) {
  try {
    const response = await axios.get(`${ASAAS_API_URL}/payments/${paymentId}`, {
      headers: {
        'access_token': ASAAS_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    return response.data.status;
  } catch (error) {
    console.error(`Erro ao buscar status do Asaas para ${paymentId}:`, error.response?.data || error.message);
    return null;
  }
}

async function sincronizarStatus() {
  const snapshot = await db.collection('cobrancas').get();
  let atualizadas = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // O campo que armazena o ID do pagamento no Asaas pode ser 'asaasPaymentId', 'asaas_id', etc.
    const paymentId = data.asaasPaymentId || data.asaas_id || data.paymentId;
    if (!paymentId) {
      console.log(`Cobrança ${doc.id} não possui ID do Asaas, pulando...`);
      continue;
    }
    const statusAtual = await buscarStatusAsaas(paymentId);
    if (statusAtual && statusAtual !== data.status) {
      await doc.ref.update({ status: statusAtual });
      atualizadas++;
      console.log(`Cobrança ${doc.id} atualizada para status: ${statusAtual}`);
    }
  }
  console.log(`\nTotal de cobranças atualizadas: ${atualizadas}`);
}

sincronizarStatus().then(() => {
  console.log('✅ Sincronização concluída!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro na sincronização:', err);
  process.exit(1);
}); 