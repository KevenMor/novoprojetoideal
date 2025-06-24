const { db } = require('../config/firebase');

// Criar forma de pagamento
exports.createFormaPagamento = async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

    const novaForma = {
      nome,
      descricao: descricao || '',
      ativa: true,
      criadaEm: new Date().toISOString()
    };

    const docRef = await db.collection('formas_pagamento').add(novaForma);
    res.status(201).json({ id: docRef.id, ...novaForma });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar forma de pagamento', details: err.message });
  }
};

// Listar formas de pagamento
exports.listFormasPagamento = async (req, res) => {
  try {
    const snapshot = await db.collection('formas_pagamento').get();
    const formas = [];
    snapshot.forEach(doc => formas.push({ id: doc.id, ...doc.data() }));
    res.json(formas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar formas de pagamento', details: err.message });
  }
};

// Deletar forma de pagamento
exports.deleteFormaPagamento = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID não informado' });
    await db.collection('formas_pagamento').doc(id).delete();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir forma de pagamento', details: err.message });
  }
}; 