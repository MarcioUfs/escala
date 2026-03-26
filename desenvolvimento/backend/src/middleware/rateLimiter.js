// const rateLimit = require('express-rate-limit');

// // 1. Limitador Geral: Proteção contra DoS e Scrapers
// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: 'draft-7',
//   legacyHeaders: false,
//   // SEGURANÇA: Usa o gerador padrão que já trata expansão de IPv6 corretamente
//   // e valida a configuração do proxy.
//   validate: { trustProxy: true }, 
//   message: { 
//     msg: "Muitas requisições detectadas deste IP. Por favor, aguarde 15 minutos." 
//   }
// });

// // 2. Limitador Rigoroso: Proteção contra Brute Force (Login/Senha)
// const strictLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hora
//   max: 5,
//   standardHeaders: 'draft-7',
//   legacyHeaders: false,
//   // SEGURANÇA: Chave composta. Se houver CPF, bloqueia o CPF. 
//   // Se não, usa o IP devidamente normalizado para IPv6.
//   keyGenerator: (req) => {
//     if (req.body && req.body.cpf) {
//       return `limit_cpf_${req.body.cpf}`;
//     }
//     return req.ip; // O express-rate-limit v7 já aplica normalização aqui se configurado o trust proxy
//   },
//   validate: { trustProxy: true },
//   message: { 
//     msg: "Muitas tentativas falhas. Por segurança, aguarde 1 hora para tentar novamente." 
//   }
// });

// module.exports = { generalLimiter, strictLimiter };
// 1. IMPORTANTE: Desestruturamos para extrair a função de mitigação de IPv6
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// 2. Limitador Geral: Protege a navegação de raspagem de dados e DoS
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { 
    msg: "Muitas requisições detectadas deste IP. Por favor, aguarde 15 minutos." 
  }
});

// 3. Limitador Rigoroso: Protege a rota de Login contra força bruta
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Tenta primeiro identificar pela regra de negócio (Login por CPF)
    if (req.body && req.body.cpf) {
      return `limit_cpf_${req.body.cpf}`;
    }
    
    // CRITÉRIO DE SEGURANÇA: Se não houver CPF, fazemos o fallback seguro.
    // O ipKeyGenerator trunca redes IPv6 mascaradas, neutralizando o bypass.
    return ipKeyGenerator(req, res); 
  },
  message: { 
    msg: "Muitas tentativas falhas. Por segurança, aguarde 1 hora para tentar novamente." 
  }
});

module.exports = { generalLimiter, strictLimiter };