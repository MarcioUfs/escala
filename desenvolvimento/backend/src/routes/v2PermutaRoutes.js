const express = require("express");
const router = express.Router();
const { verifyJwt: verifyJwtUser, isUser } = require("../middleware/verifyJWT");
const { verifyJwt: verifyJwtAdmin, isAdmin } = require("../middleware/verifyJWTAdmin");
const { authenticatedLimiter, strictLimiter } = require("../middleware/rateLimiter");

const {
  listarAgendaV2,
  criarSolicitacaoPermutaV2,
  listarMinhasSolicitacoesV2,
  confirmarAlvoV2,
  recusarAlvoV2,
  marcarLidaV2,
  contarPendenciasV2,
  listarPendentesAdminV2,
  contarPendenciasAdminV2,
  aprovarPermutaV2,
  rejeitarPermutaV2,
} = require("../controllers/v2PermutaController");

// -----------------------------------------------------------------------
// PERMUTA COM APROVAÇÃO
// Montado em "/permutas" no app.js. Duas identidades diferentes usam esse
// router: o militar comum (solicitante/alvo, token de "../middleware/
// verifyJWT") e o admin (aprovação final, token de "../middleware/
// verifyJWTAdmin") — por isso os dois pares de middleware são importados
// lado a lado em vez de um só, diferente de v2EscalaRoutes.js.
// -----------------------------------------------------------------------

// GET /permutas/agenda/:idUsuario?dias=60
// Dias/turnos em que o usuário informado está efetivamente escalado —
// usado nos dois primeiros passos do assistente (meus dias, dias do alvo)
router.get(
  "/agenda/:idUsuario",
  verifyJwtUser,
  isUser,
  authenticatedLimiter,
  listarAgendaV2,
);

// POST /permutas
// Passo final do assistente: cria a solicitação (status AGUARDANDO_ALVO)
router.post("/", verifyJwtUser, isUser, authenticatedLimiter, criarSolicitacaoPermutaV2);

// GET /permutas/minhas
// Solicitações onde sou solicitante OU alvo
router.get("/minhas", verifyJwtUser, isUser, authenticatedLimiter, listarMinhasSolicitacoesV2);

// GET /permutas/pendencias
// Badges do usuário logado (aguardando minha ação / atualizações não lidas)
router.get("/pendencias", verifyJwtUser, isUser, authenticatedLimiter, contarPendenciasV2);

// PUT /permutas/:id/confirmar
// O alvo confere os dados e confirma -> segue pro admin
router.put(
  "/:id/confirmar",
  verifyJwtUser,
  isUser,
  authenticatedLimiter,
  confirmarAlvoV2,
);

// PUT /permutas/:id/recusar
// O alvo recusa, com motivo — encerra a solicitação
router.put("/:id/recusar", verifyJwtUser, isUser, strictLimiter, recusarAlvoV2);

// PUT /permutas/:id/marcar-lida
// Limpa o aviso de uma solicitação já vista pelo usuário logado
router.put(
  "/:id/marcar-lida",
  verifyJwtUser,
  isUser,
  authenticatedLimiter,
  marcarLidaV2,
);

// -----------------------------------------------------------------------
// ANÁLISE DO ADMIN
// -----------------------------------------------------------------------

// GET /permutas/admin/pendentes
router.get(
  "/admin/pendentes",
  verifyJwtAdmin,
  isAdmin,
  authenticatedLimiter,
  listarPendentesAdminV2,
);

// GET /permutas/admin/pendencias
router.get(
  "/admin/pendencias",
  verifyJwtAdmin,
  isAdmin,
  authenticatedLimiter,
  contarPendenciasAdminV2,
);

// PUT /permutas/:id/aprovar
// Aceite final — gera as 2 linhas de substituição pontual na escala
router.put("/:id/aprovar", verifyJwtAdmin, isAdmin, strictLimiter, aprovarPermutaV2);

// PUT /permutas/:id/rejeitar
router.put("/:id/rejeitar", verifyJwtAdmin, isAdmin, strictLimiter, rejeitarPermutaV2);

module.exports = router;
