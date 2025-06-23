const { db } = require('../config/firebase');

// Criar cliente/fornecedor
exports.createClienteFornecedor = async (req, res) => {
  try {
    const { nome, tipo, documento, contato, telefone } = req.body;
    if (!nome || !tipo) return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });

    const novo = {
      nome,
      tipo, // cliente ou fornecedor
      documento: documento || '',
      contato: contato || '',
      telefone: telefone || '',
      ativa: true,
      criadaEm: new Date().toISOString()
    };

    const docRef = await db.collection('clientes_fornecedores').add(novo);
    res.status(201).json({ id: docRef.id, ...novo });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar cliente/fornecedor', details: err.message });
  }
};

// Listar clientes/fornecedores
exports.listClientesFornecedores = async (req, res) => {
  try {
    const snapshot = await db.collection('clientes_fornecedores').get();
    const lista = [];
    snapshot.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar clientes/fornecedores', details: err.message });
  }
}; 