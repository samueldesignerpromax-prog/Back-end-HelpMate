const router = require('express').Router();
const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// ===== CLIENTE =====

// 1. Criar ticket
router.post('/', auth, async (req, res) => {
  try {
    const ticket = new Ticket({
      client: req.userId,
      subject: req.body.subject,
      category: req.body.category,
      priority: req.body.priority || 'medium',
    });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. Listar meus tickets (cliente)
router.get('/my', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ client: req.userId })
      .populate('agent', 'name')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AGENTE / ADMIN =====

// 3. Listar todos os tickets (com filtros)
router.get('/admin', auth, admin, async (req, res) => {
  try {
    const { status, agent } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (agent) filter.agent = agent;

    const tickets = await Ticket.find(filter)
      .populate('client', 'name email')
      .populate('agent', 'name')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Atribuir ticket a um agente
router.put('/admin/:id/assign', auth, admin, async (req, res) => {
  try {
    const { agentId } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { agent: agentId, status: 'in_progress', updatedAt: Date.now() },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Atualizar status do ticket
router.put('/admin/:id/status', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Buscar mensagens de um ticket
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket não encontrado' });

    // Verifica se o usuário é o cliente ou um agente/admin
    const user = req.userId;
    if (ticket.client.toString() !== user && !['admin', 'agent'].includes(req.userRole)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const messages = await Message.find({ ticket: req.params.id })
      .populate('sender', 'name email role avatar')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
