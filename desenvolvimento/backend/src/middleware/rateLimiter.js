// 1. IMPORTANTE: Desestruturamos para extrair a função de mitigação de IPv6
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Handler compartilhado: sempre que um limite é atingido, devolve o header
// Retry-After (em segundos) além da mensagem — sem isso o cliente sabe que
// foi bloqueado, mas não sabe quando pode tentar de novo.
function handlerComRetryAfter(req, res, next, options) {
  const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
  res.set('Retry-After', String(retryAfterSeconds));
  res.status(options.statusCode).json({
    ...options.message,
    retryAfterSeconds,
  });
}

// 2. Limitador Geral: navegação pública / não autenticada (ex: /docs,
// tentativa de acesso antes do login). Não é o limitador certo pra rotas
// já autenticadas — ver authenticatedLimiter abaixo.
const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    msg: "Muitas requisições detectadas deste IP. Aguarde alguns minutos e tente novamente.",
  },
  handler: handlerComRetryAfter,
});

// 2.1 Limitador para rotas autenticadas de uso intenso (dashboard, gestão
// de efetivo, etc.). Janela mais curta e teto bem mais alto que o
// generalLimiter, porque uma sessão de trabalho normal já gera várias
// chamadas legítimas em sequência (cada ação da tela de escala dispara
// mais de uma requisição).
//
// Identifica por usuário (req.user, já populado pelo verifyJwt que roda
// antes na cadeia da rota) em vez de só por IP — assim, uma pessoa muito
// ativa não consome a cota de todo mundo atrás do mesmo IP/proxy.
// Só cai no fallback por IP se, por algum motivo, req.user não existir
// ainda nesse ponto (ver nota de aplicação abaixo).
const authenticatedLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const idUsuario = req.user?.id_user || req.user?.id_admin;
    if (idUsuario) return `user_${idUsuario}`;
    return ipKeyGenerator(req, res);
  },
  message: {
    msg: "Muitas requisições em pouco tempo. Aguarde um instante e tente novamente.",
  },
  handler: handlerComRetryAfter,
});

// 3. Limitador Rigoroso: protege login e troca de senha contra força
// bruta. Mantido como estava — não é o que causou o bloqueio que você
// viu, e o desenho (chave por CPF) já está correto pra esse propósito.
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
    msg: "Muitas tentativas falhas. Por segurança, aguarde 1 hora para tentar novamente.",
  },
  handler: handlerComRetryAfter,
});

module.exports = { generalLimiter, authenticatedLimiter, strictLimiter };