const express = require("express");
const router = express.Router();
const { verifyJwt, isAdmin } = require("../middleware/verifyJWTAdmin");
const { authenticatedLimiter } = require("../middleware/rateLimiter");

const {
  gerarEscalaV2,
  criarAjusteManualV2,
  listarEscalasV2,
  listarEscalaPeriodoEstendidoV2,
  getEscalaV2ById,
  reverterParaCicloV2,
  vincularUsuarioGrupamentoV2,
  desvincularUsuarioGrupamentoV2,
  listarMembrosGrupamentoV2,
  criarSubstituicaoAdicaoV2,
  criarSubstituicaoExclusaoV2,
  criarSubstituicaoPermutaV2,
  listarSubstituicoesDoDiaV2,
  reverterSubstituicaoV2,
} = require("../controllers/v2EscalaController");

// -----------------------------------------------------------------------
// ESCALA
// Montado em "/escalas" no app.js -> URLs finais abaixo de cada rota
// Ordem dos middlewares: verifyJwt (está logado?) -> isAdmin (tem
// permissão?) -> authenticatedLimiter (não está abusando da API?). Checar
// a permissão antes do rate limit evita gastar cota de quem nem deveria
// estar ali.
// -----------------------------------------------------------------------

// POST /escalas/gerar
// Gera em massa, a partir do ciclo, todos os dias de um período
router.post("/gerar", verifyJwt, isAdmin, authenticatedLimiter, gerarEscalaV2);

// POST /escalas/ajuste
// Cria/sobrescreve um ajuste manual em um dia+turno específico
router.post("/ajuste", verifyJwt, isAdmin, authenticatedLimiter, criarAjusteManualV2);

// POST /escalas/listar
// Lista por mês, data ou dia (filtros vêm pelo body)
router.post("/listar", verifyJwt, isAdmin, authenticatedLimiter, listarEscalasV2);

// POST /escalas/listar/periodo-estendido
// Lista os N últimos dias do mês anterior + o mês de referência inteiro
// (ex: mes_referencia "07/2026" -> 27/06/2026 a 31/07/2026)
router.post(
  "/listar/periodo-estendido",
  verifyJwt,
  isAdmin,
  authenticatedLimiter,
  listarEscalaPeriodoEstendidoV2,
);

// GET /escalas/:id
// Busca uma linha específica da escala
router.get("/:id", verifyJwt, isAdmin, authenticatedLimiter, getEscalaV2ById);

// PUT /escalas/:id/reverter
// Desfaz um ajuste manual, devolvendo o grupamento que o ciclo determinaria
router.put("/:id/reverter", verifyJwt, isAdmin, authenticatedLimiter, reverterParaCicloV2);

// -----------------------------------------------------------------------
// GRUPAMENTO_USUARIO
// Tecnicamente não é "escala", é o vínculo usuário-grupamento — mas fica
// no mesmo router por conveniência, já que hoje é um módulo só. Se esse
// conjunto crescer, vale extrair pra um /grupamentos ou /vinculos próprio.
// -----------------------------------------------------------------------

// POST /escalas/grupamento-usuario
// Vincula um usuário a um grupamento (abre um novo período)
router.post(
  "/grupamento-usuario",
  verifyJwt,
  isAdmin,
  authenticatedLimiter,
  vincularUsuarioGrupamentoV2,
);

// PUT /escalas/grupamento-usuario/:id/encerrar
// Encerra o vínculo (fecha o período, não apaga a linha)
router.put(
  "/grupamento-usuario/:id/encerrar",
  verifyJwt,
  isAdmin,
  authenticatedLimiter,
  desvincularUsuarioGrupamentoV2,
);

// GET /escalas/grupamento/:id/membros
// Lista os militares com vínculo ativo (sem data_fim) num grupamento
router.get(
  "/grupamento/:id/membros",
  verifyJwt,
  isAdmin,
  authenticatedLimiter,
  listarMembrosGrupamentoV2,
);

// -----------------------------------------------------------------------
// SUBSTITUIÇÃO PONTUAL
// Exceções por data+turno que não mexem no vínculo mensal (v2_grupamento_
// usuario) de ninguém — usadas pelo painel do dia no frontend.
// -----------------------------------------------------------------------

// POST /escalas/substituicao/adicionar
router.post(
  "/substituicao/adicionar",
  verifyJwt,
  isAdmin,
  authenticatedLimiter,
  criarSubstituicaoAdicaoV2,
);

// POST /escalas/substituicao/excluir
router.post(
  "/substituicao/excluir",
  verifyJwt,
  isAdmin,
  authenticatedLimiter,
  criarSubstituicaoExclusaoV2,
);

// POST /escalas/substituicao/permutar
router.post(
  "/substituicao/permutar",
  verifyJwt,
  isAdmin,
  authenticatedLimiter,
  criarSubstituicaoPermutaV2,
);

// GET /escalas/substituicao/dia/:data
router.get(
  "/substituicao/dia/:data",
  verifyJwt,
  isAdmin,
  authenticatedLimiter,
  listarSubstituicoesDoDiaV2,
);

// DELETE /escalas/substituicao/:id
router.delete(
  "/substituicao/:id",
  verifyJwt,
  isAdmin,
  authenticatedLimiter,
  reverterSubstituicaoV2,
);

module.exports = router;