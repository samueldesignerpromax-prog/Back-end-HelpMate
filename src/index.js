const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const setupSocket = require('./socket');

dotenv.config();

const app = express();
const server = createServer(app);

// Configura o Socket.io
const io = setupSocket(server);

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🟢 Conectado ao MongoDB (HelpMate)!'))
  .catch(err => console.log('🔴 Erro no DB:', err.message));

// Rotas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));

// Rota de status
app.get('/api/status', (req, res) => {
  res.json({ status: 'API HelpMate Rodando', db: mongoose.connection.readyState === 1 });
});

// Inicialização
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor (HelpMate) rodando na porta ${PORT}`);
  console.log(`📡 Socket.io aguardando conexões...`);
});
