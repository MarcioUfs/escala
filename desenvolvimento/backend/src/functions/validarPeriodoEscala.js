function validarPeriodoEscala(dataInicioStr, dataFimStr) {
  // 1. Verifica se ambas as datas foram enviadas
  if (!dataInicioStr || !dataFimStr) {
    return { 
      valido: false, 
      motivo: "Ambas as datas (início e fim) devem ser fornecidas." 
    };
  }

  // 2. Converte as strings de timestamp para objetos Date do JavaScript
  const dataInicio = new Date(dataInicioStr);
  const dataFim = new Date(dataFimStr);

  // 3. Verifica se as strings eram datas válidas para o JavaScript
  if (isNaN(dataInicio.getTime())) {
    return { valido: false, motivo: `A data de início [${dataInicioStr}] é inválida.` };
  }
  if (isNaN(dataFim.getTime())) {
    return { valido: false, motivo: `A data de fim [${dataFimStr}] é inválida.` };
  }

  // 4. Regra de negócio: data início não pode ser posterior à data fim
  if (dataInicio.getTime() > dataFim.getTime()) {
    return { 
      valido: false, 
      motivo: "A data de início não pode ser posterior (vir depois) à data de fim." 
    };
  }

  // 5. Opcional: Impede que a escala comece e termine exatamente no mesmo milissegundo
  if (dataInicio.getTime() === dataFim.getTime()) {
    return { 
      valido: false, 
      motivo: "A data de início e a data de fim não podem ser idênticas." 
    };
  }

  // Se passar em tudo
  return { valido: true };
}

module.exports = validarPeriodoEscala;