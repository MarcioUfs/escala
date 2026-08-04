/**
 * Calcula um intervalo de datas composto por:
 *   - os últimos `diasMesAnterior` dias do mês anterior ao mês de referência
 *   - o mês de referência inteiro
 *
 * Exemplo: calcularPeriodoEstendido("07/2026", 4)
 *   -> { data_inicio: "2026-06-27", data_fim: "2026-07-31" }
 *   (27, 28, 29 e 30/06 são os 4 últimos dias de junho; depois todo julho)
 *
 * @param {string} mesReferencia formato "MM/YYYY", ex: "07/2026"
 * @param {number} diasMesAnterior quantidade de dias do mês anterior a incluir (padrão 4)
 * @returns {{ data_inicio: string, data_fim: string }} datas no formato YYYY-MM-DD
 */
function calcularPeriodoEstendido(mesReferencia, diasMesAnterior = 4) {
  if (!mesReferencia || !/^\d{2}\/\d{4}$/.test(mesReferencia)) {
    throw new Error('mesReferencia deve estar no formato "MM/YYYY", ex: "07/2026"');
  }

  const [mesStr, anoStr] = mesReferencia.split("/");
  const mes = parseInt(mesStr, 10); // 1 a 12
  const ano = parseInt(anoStr, 10);

  if (mes < 1 || mes > 12) {
    throw new Error("Mês inválido em mesReferencia");
  }

  // Date.UTC(ano, mes, 0) = "dia 0" do mês seguinte = último dia do mês de referência
  const primeiroDiaMesReferencia = new Date(Date.UTC(ano, mes - 1, 1));
  const ultimoDiaMesReferencia = new Date(Date.UTC(ano, mes, 0));

  const dataInicio = new Date(primeiroDiaMesReferencia);
  dataInicio.setUTCDate(dataInicio.getUTCDate() - diasMesAnterior);

  return {
    data_inicio: dataInicio.toISOString().slice(0, 10),
    data_fim: ultimoDiaMesReferencia.toISOString().slice(0, 10),
  };
}

module.exports = calcularPeriodoEstendido;
