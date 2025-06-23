const { db } = require('../config/firebase');

// Criar lançamento financeiro
exports.createLancamento = async (req, res) => {
  try {
    const {
      empresa,
      unidadeId,
      categoriaId,
      contaId,
      formaPagamentoId,
      clienteFornecedorId,
      descricao,
      documento,
      tipo, // despesa ou receita
      pagarAutomatico,
      lancamentoPago,
      dataVencimento,
      dataPagamento,
      valor,
      valorPago
    } = req.body;

    if (!empresa || !categoriaId || !contaId || !formaPagamentoId || !tipo || !dataVencimento || !valor) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    const novoLancamento = {
      empresa,
      unidadeId: unidadeId || null,
      categoriaId,
      contaId,
      formaPagamentoId,
      clienteFornecedorId: clienteFornecedorId || null,
      descricao: descricao || '',
      documento: documento || '',
      tipo,
      pagarAutomatico: !!pagarAutomatico,
      lancamentoPago: !!lancamentoPago,
      dataVencimento,
      dataPagamento: dataPagamento || null,
      valor: parseFloat(valor),
      valorPago: valorPago ? parseFloat(valorPago) : 0,
      criadoPor: req.user?.uid || null,
      criadoEm: new Date().toISOString()
    };

    const docRef = await db.collection('lancamentos').add(novoLancamento);
    res.status(201).json({ id: docRef.id, ...novoLancamento });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar lançamento', details: err.message });
  }
};

// Listar lançamentos (com filtros básicos)
exports.listLancamentos = async (req, res) => {
  try {
    const { unidadeId, categoriaId, contaId, tipo, dataInicio, dataFim } = req.query;
    let query = db.collection('lancamentos');
    if (unidadeId) query = query.where('unidadeId', '==', unidadeId);
    if (categoriaId) query = query.where('categoriaId', '==', categoriaId);
    if (contaId) query = query.where('contaId', '==', contaId);
    if (tipo) query = query.where('tipo', '==', tipo);
    // Filtro por data de vencimento
    if (dataInicio) query = query.where('dataVencimento', '>=', dataInicio);
    if (dataFim) query = query.where('dataVencimento', '<=', dataFim);

    const snapshot = await query.get();
    const lancamentos = [];
    snapshot.forEach(doc => lancamentos.push({ id: doc.id, ...doc.data() }));
    res.json(lancamentos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar lançamentos', details: err.message });
  }
}; 