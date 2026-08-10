const express = require("express");
const router = express.Router();
const { verifyJwt } = require("../middleware/verifyJWTAdmin");

const {
  gerarEscalaV2,
  criarAjusteManualV2,
  listarEscalasV2,
  listarEscalaPeriodoEstendidoV2,
  getEscalaV2ById,
  reverterParaCicloV2,
  vincularUsuarioGrupamentoV2,
  desvincularUsuarioGrupamentoV2,
  listarMembrosGrupamentoV2
} = require("../controllers/v2EscalaController");

// -----------------------------------------------------------------------
// ESCALA
// Montado em "/escalas" no app.js -> URLs finais abaixo de cada rota
// -----------------------------------------------------------------------

// POST /escalas/gerar
// Gera em massa, a partir do ciclo, todos os dias de um período
router.post("/gerar", verifyJwt, gerarEscalaV2);

// POST /escalas/ajuste
// Cria/sobrescreve um ajuste manual em um dia+turno específico
router.post("/ajuste", verifyJwt, criarAjusteManualV2);

// POST /escalas/listar
// Lista por mês, data ou dia (filtros vêm pelo body)
router.post("/listar", verifyJwt, listarEscalasV2);

// POST /escalas/listar/periodo-estendido
// Lista os N últimos dias do mês anterior + o mês de referência inteiro
// (ex: mes_referencia "07/2026" -> 27/06/2026 a 31/07/2026)
router.post("/listar/periodo-estendido", verifyJwt, listarEscalaPeriodoEstendidoV2);

// GET /escalas/:id
// Busca uma linha específica da escala
router.get("/:id", verifyJwt, getEscalaV2ById);

// PUT /escalas/:id/reverter
// Desfaz um ajuste manual, devolvendo o grupamento que o ciclo determinaria
router.put("/:id/reverter", verifyJwt, reverterParaCicloV2);


// GET /escalas/grupamento/:id/membros
router.get("/grupamento/:id/membros", verifyJwt, listarMembrosGrupamentoV2);


// -----------------------------------------------------------------------
// GRUPAMENTO_USUARIO
// Tecnicamente não é "escala", é o vínculo usuário-grupamento — mas fica
// no mesmo router por conveniência, já que hoje é um módulo só. Se esse
// conjunto crescer, vale extrair pra um /grupamentos ou /vinculos próprio.
// -----------------------------------------------------------------------

// POST /escalas/grupamento-usuario
// Vincula um usuário a um grupamento (abre um novo período)
router.post("/grupamento-usuario", verifyJwt, vincularUsuarioGrupamentoV2);

// PUT /escalas/grupamento-usuario/:id/encerrar
// Encerra o vínculo (fecha o período, não apaga a linha)
router.put("/grupamento-usuario/:id/encerrar", verifyJwt, desvincularUsuarioGrupamentoV2);

module.exports = router;