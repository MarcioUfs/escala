const express = require("express");
const router = express.Router();
const {verifyJwt} = require("../middleware/verifyJWTAdmin");

const {
  gerarEscalaV2,
  criarAjusteManualV2,
  listarEscalasV2,
  listarEscalaPeriodoEstendidoV2,
  getEscalaV2ById,
  reverterParaCicloV2,
  vincularUsuarioGrupamentoV2,
  desvincularUsuarioGrupamentoV2,
} = require("../controllers/v2EscalaController");

// -----------------------------------------------------------------------
// ESCALA (v2)
// -----------------------------------------------------------------------

// Gera em massa, a partir do ciclo, todos os dias de um período
router.post("/la/gerar", verifyJwt, gerarEscalaV2);

// Cria/sobrescreve um ajuste manual em um dia+turno específico
router.post("/la/ajuste", verifyJwt, criarAjusteManualV2);

// Lista por mês, data ou dia (filtros vêm pelo body, igual ao
// listarEscalaGuarnicoes original)
router.post("/la/listar", verifyJwt, listarEscalasV2);

// Lista os N últimos dias do mês anterior + o mês de referência inteiro
// (ex: mes_referencia "07/2026" -> 27/06/2026 a 31/07/2026)
router.post("/la/listar/periodo-estendido", verifyJwt, listarEscalaPeriodoEstendidoV2);

// Busca uma linha específica da escala
router.get("/la/:id", verifyJwt, getEscalaV2ById);

// Desfaz um ajuste manual, devolvendo o grupamento que o ciclo determinaria
router.put("/la/:id/reverter", verifyJwt, reverterParaCicloV2);

// -----------------------------------------------------------------------
// GRUPAMENTO_USUARIO (v2)
// -----------------------------------------------------------------------

// Vincula um usuário a um grupamento (abre um novo período)
router.post("/v2/grupamento-usuario", verifyJwt, vincularUsuarioGrupamentoV2);

// Encerra o vínculo (fecha o período, não apaga a linha)
router.put("/v2/grupamento-usuario/:id/encerrar", verifyJwt, desvincularUsuarioGrupamentoV2);

module.exports = router;
