const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    
    // Verifica se o usuário é admin (ou agente, se preferir)
    if (user.role !== 'admin' && user.role !== 'agent') {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores e agentes.' });
    }
    // Salva o papel do usuário na requisição para usar nas rotas
    req.userRole = user.role;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao verificar permissão' });
  }
};
