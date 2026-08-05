const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Message = require('../models/Message');

let io;

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // em produção, coloque a URL do front-end
      methods: ['GET', 'POST'],
    },
  });

  // Middleware de autenticação via token (opcional)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Token não fornecido'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('Usuário não encontrado'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Autenticação inválida'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 Cliente conectado: ${socket.id} (${socket.user?.name})`);

    // Entrar em uma sala (ticket)
    socket.on('join_ticket', async (ticketId) => {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) return socket.emit('error', 'Ticket não encontrado');

      // Verifica se o usuário tem permissão
      const user = socket.user;
      if (
        ticket.client.toString() !== user._id.toString() &&
        !['admin', 'agent'].includes(user.role)
      ) {
        return socket.emit('error', 'Acesso negado');
      }

      socket.join(ticketId);
      socket.ticketId = ticketId;
      console.log(`📂 Usuário ${user.name} entrou na sala ${ticketId}`);
    });

    // Enviar mensagem
    socket.on('send_message', async (data) => {
      try {
        const { ticketId, text } = data;
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return socket.emit('error', 'Ticket não encontrado');

        // Salva a mensagem no banco
        const message = new Message({
          ticket: ticketId,
          sender: socket.user._id,
          text,
        });
        await message.save();
        await message.populate('sender', 'name email role avatar');

        // Emite para todos na sala (inclusive o próprio)
        io.to(ticketId).emit('new_message', message);
      } catch (error) {
        socket.emit('error', error.message);
      }
    });

    // "Digitando..." (opcional)
    socket.on('typing', (ticketId) => {
      socket.to(ticketId).emit('user_typing', {
        userId: socket.user._id,
        name: socket.user.name,
      });
    });

    // Sair da sala
    socket.on('disconnect', () => {
      console.log(`🔴 Cliente desconectado: ${socket.id}`);
      if (socket.ticketId) {
        socket.leave(socket.ticketId);
      }
    });
  });

  return io;
};

module.exports = setupSocket;
