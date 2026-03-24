const rateLimit = require('express-rate-limit');

// 1. Limitador Geral: Aplicado na maioria das rotas (user e admin)
// Permite uma quantidade razoável de navegação no sistema
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 100, // Limita cada IP a 100 requisições por janela
  standardHeaders: true, // Retorna os headers de rate limit (RateLimit-*)
  legacyHeaders: false, // Desabilita os headers antigos (X-RateLimit-*)
  message: { 
    msg: "Muitas requisições detectadas deste IP. Por favor, aguarde 15 minutos." 
  }
});

// 2. Limitador Rigoroso: Aplicado APENAS em rotas críticas (ex: Login, Alterar Senha)
// Evita que fiquem tentando adivinhar a senha do militar ou do admin
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 tentativas
  standardHeaders: true,
  legacyHeaders: false,
  // NOVO: Adicione esta função keyGenerator
  keyGenerator: (req, res) => {
    // Se a requisição tiver um cpf no corpo (ex: tentativa de login), bloqueia por cpf.
    // Se não tiver, cai no padrão e bloqueia pelo IP.
    return req.body.cpf // || req.ip; 
  },
  message: { 
    msg: "Muitas tentativas falhas. Por segurança, aguarde 1 hora para tentar novamente." 
  }
});

module.exports = { generalLimiter, strictLimiter };