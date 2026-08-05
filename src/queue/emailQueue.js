const Queue = require('bull');
const redis = require('../config/redis');
const nodemailer = require('nodemailer');

// Configuração do transportador de e-mail (ex: Gmail, SendGrid)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'seuemail@gmail.com',
    pass: process.env.EMAIL_PASS || 'suasenha',
  },
});

// Cria uma fila chamada "emailQueue" usando o Redis
const emailQueue = new Queue('emailQueue', {
  redis: {
    host: redis.options.host,
    port: redis.options.port,
    password: redis.options.password,
  },
});

// Processador da fila
emailQueue.process(async (job) => {
  const { to, subject, text } = job.data;
  await transporter.sendMail({
    from: 'Suporte HelpMate <no-reply@helpmate.com>',
    to,
    subject,
    text,
  });
  console.log(`📧 E-mail enviado para ${to}`);
});

// Função para adicionar um e-mail à fila
const sendEmail = (to, subject, text) => {
  emailQueue.add({ to, subject, text });
};

module.exports = { emailQueue, sendEmail };
