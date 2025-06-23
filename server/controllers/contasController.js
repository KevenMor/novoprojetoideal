const { db } = require('../config/firebase');

// Criar conta
exports.createConta = async (req, res) => {
  try {
    const { nome, tipo, banco, agencia, numero } = req.body;
    if (!nome || !tipo) return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });

    const novaConta = {
      nome,
      tipo, // conta_corrente, poupanca, cartao_credito, etc
      banco: banco || '',
      agencia: agencia || '',
      numero: numero || '',
      ativa: true,
      criadaEm: new Date().toISOString()
    };

    const docRef = await db.collection('contas').add(novaConta);
    res.status(201).json({ id: docRef.id, ...novaConta });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar conta', details: err.message });
  }
};

// Listar contas
exports.listContas = async (req, res) => {
  try {
    const snapshot = await db.collection('contas').get();
    const contas = [];
    snapshot.forEach(doc => contas.push({ id: doc.id, ...doc.data() }));
    res.json(contas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar contas', details: err.message });
  }
}; 