const express = require("express");
const router = express.Router();
const { verifyJwt, isAdmin } = require("../middleware/verifyJWTAdmin");
const { authenticatedLimiter } = require("../middleware/rateLimiter");

const {
  listarMotivosRestricaoV2,
  criarMotivoRestricaoV2,
  listarAfastamentosV2,
  obterAfastamentoV2,
  criarAfastamentoV2,
  atualizarAfastamentoV2,
  encerrarAfastamentoV2,
  excluirAfastamentoV2,
  contarAfastamentosAtivosV2,
  gerarResumoEfetivoV2,
  gerarBoletimV2,
} = require("../controllers/v2AfastamentoController");

// -----------------------------------------------------------------------
// AFASTAMENTOS E RESTRIÇÕES
// Montado em "/afastamentos" no app.js. 100% restrito a administradores —
// os dados aqui (motivo de restrição médica/legal, BGO, período) são
// sensíveis e não têm nenhuma rota equivalente pro militar comum.
// -----------------------------------------------------------------------

// GET /afastamentos/motivos
router.get("/motivos", verifyJwt, isAdmin, authenticatedLimiter, listarMotivosRestricaoV2);

// POST /afastamentos/motivos
router.post("/motivos", verifyJwt, isAdmin, authenticatedLimiter, criarMotivoRestricaoV2);

// GET /afastamentos/contagem-ativos
router.get("/contagem-ativos", verifyJwt, isAdmin, authenticatedLimiter, contarAfastamentosAtivosV2);

// POST /afastamentos/resumo
router.post("/resumo", verifyJwt, isAdmin, authenticatedLimiter, gerarResumoEfetivoV2);

// POST /afastamentos/boletim
router.post("/boletim", verifyJwt, isAdmin, authenticatedLimiter, gerarBoletimV2);

// GET /afastamentos
router.get("/", verifyJwt, isAdmin, authenticatedLimiter, listarAfastamentosV2);

// POST /afastamentos
router.post("/", verifyJwt, isAdmin, authenticatedLimiter, criarAfastamentoV2);

// GET /afastamentos/:id
router.get("/:id", verifyJwt, isAdmin, authenticatedLimiter, obterAfastamentoV2);

// PUT /afastamentos/:id
router.put("/:id", verifyJwt, isAdmin, authenticatedLimiter, atualizarAfastamentoV2);

// PATCH /afastamentos/:id/encerrar
router.patch("/:id/encerrar", verifyJwt, isAdmin, authenticatedLimiter, encerrarAfastamentoV2);

// DELETE /afastamentos/:id
router.delete("/:id", verifyJwt, isAdmin, authenticatedLimiter, excluirAfastamentoV2);

module.exports = router;
