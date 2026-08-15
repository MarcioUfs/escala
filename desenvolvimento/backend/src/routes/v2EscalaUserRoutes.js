const express = require("express");
const router = express.Router();
const { verifyJwt, isUser } = require("../middleware/verifyJWT");
const { authenticatedLimiter } = require("../middleware/rateLimiter");

const {
  listarEscalaPeriodoEstendidoV2,
  listarMembrosGrupamentoV2,
  listarSubstituicoesDoDiaV2,
} = require("../controllers/v2EscalaController");

// -----------------------------------------------------------------------
// ESCALA — VERSÃO SOMENTE LEITURA DO MILITAR COMUM
// Montado em "/minha-escala" no app.js.
//
// Duplicata deliberada de 3 rotas de v2EscalaRoutes.js (mesmo controller,
// mesma função — só a definição de rota é repetida), em vez de usar um
// middleware "aceita token de user OU de admin" compartilhado. Dois
// verificadores de JWT independentes (verifyJWT.js pra isso aqui,
// verifyJWTAdmin.js pra tudo em v2EscalaRoutes.js) mantêm os dois domínios
// de confiança sempre separados — nenhuma rota decide "qual segredo
// tentar primeiro", então não existe ambiguidade de qual token autenticou
// o quê. O soldado só enxerga a escala (pra achar o próprio dia e o de
// quem ele quer permutar); toda ação de escrita continua exclusiva do
// admin em v2EscalaRoutes.js.
// -----------------------------------------------------------------------

// POST /minha-escala/listar/periodo-estendido
router.post(
  "/listar/periodo-estendido",
  verifyJwt,
  isUser,
  authenticatedLimiter,
  listarEscalaPeriodoEstendidoV2,
);

// GET /minha-escala/grupamento/:id/membros
router.get(
  "/grupamento/:id/membros",
  verifyJwt,
  isUser,
  authenticatedLimiter,
  listarMembrosGrupamentoV2,
);

// GET /minha-escala/substituicao/dia/:data
router.get(
  "/substituicao/dia/:data",
  verifyJwt,
  isUser,
  authenticatedLimiter,
  listarSubstituicoesDoDiaV2,
);

module.exports = router;
