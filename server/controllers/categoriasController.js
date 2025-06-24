const { db } = require('../config/firebase');

// Criar categoria
exports.createCategoria = async (req, res) => {
  try {
    const { nome, descricao, categoriaMaeId } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

    const novaCategoria = {
      nome,
      descricao: descricao || '',
      categoriaMaeId: categoriaMaeId || null,
      ativa: true,
      criadaEm: new Date().toISOString()
    };

    const docRef = await db.collection('categorias').add(novaCategoria);
    res.status(201).json({ id: docRef.id, ...novaCategoria });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar categoria', details: err.message });
  }
};

// Listar categorias (opcional: filtrar por categoria mãe)
exports.listCategorias = async (req, res) => {
  try {
    const { categoriaMaeId } = req.query;
    let query = db.collection('categorias');
    if (categoriaMaeId) query = query.where('categoriaMaeId', '==', categoriaMaeId);

    const snapshot = await query.get();
    const categorias = [];
    snapshot.forEach(doc => categorias.push({ id: doc.id, ...doc.data() }));
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar categorias', details: err.message });
  }
};

// Deletar categoria
exports.deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID não informado' });
    await db.collection('categorias').doc(id).delete();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir categoria', details: err.message });
  }
}; 