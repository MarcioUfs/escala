const database = require("../database/db");

const LIMITE_HISTORICO_PADRAO = 20;
const LIMITE_HISTORICO_MAXIMO = 100;

// GET /admin/antiguidade/historico-scraper?limite=20 -- visibilidade pro
// admin sobre as últimas execuções do cron de antiguidade, sem precisar
// de acesso ao log do servidor (O1: antes disso só existia console.log).
async function historico(req, res) {
  try {
    const pedido = Number.parseInt(req.query.limite, 10);
    const limite = Number.isInteger(pedido)
      ? Math.min(Math.max(pedido, 1), LIMITE_HISTORICO_MAXIMO)
      : LIMITE_HISTORICO_PADRAO;

    const execucoes = await database("scraper_execucoes")
      .where({ rotina: "antiguidade" })
      .orderBy("iniciado_em", "desc")
      .limit(limite);

    return res.status(200).json({ execucoes });
  } catch (error) {
    console.error("[scraperStatusController]", error);
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

module.exports = { historico };
