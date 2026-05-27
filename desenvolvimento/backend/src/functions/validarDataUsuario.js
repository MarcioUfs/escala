function validarDataUsuario(dataStr) {
  // 1. Remove espaços em branco nas pontas
  if (typeof dataStr !== "string") {
    return { valido: false, motivo: "O valor enviado não é um texto." };
  }
  const dataLimpa = dataStr.trim();

  // 2. Valida o formato básico via Regex (YYYY-MM-DD)
  // Captura: Ano (4 dígitos), Mês (1 ou 2 dígitos), Dia (1 ou 2 dígitos)
  const regex = /^(\d{4})\-(\d{1,2})\-(\d{1,2})$/;
  const match = dataLimpa.match(regex);

  if (!match) {
    return { valido: false, motivo: "Formato inválido. Use o padrão YYYY-MM-DD (ex: 2026-04-25)." };
  }

  // 3. Converte os pedaços em números inteiros seguindo a nova ordem do Regex
  const ano = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const dia = parseInt(match[3], 10);

  // 4. Validações básicas de limites lógicos
  if (mes < 1 || mes > 12) {
    return { valido: false, motivo: `O mês [${mes}] não existe no calendário.` };
  }
  if (dia < 1 || dia > 31) {
    return { valido: false, motivo: `O dia [${dia}] é inválido para qualquer mês.` };
  }
  if (ano < 1900 || ano > 2100) {
    return { valido: false, motivo: `O ano [${ano}] está fora do limite operacional do sistema.` };
  }

  // 5. O truque do JavaScript para validar a existência real da data
  const dataObjeto = new Date(ano, mes - 1, dia);

  // Se o JS mudou o dia, mês ou ano, significa que a data original não existia!
  if (
    dataObjeto.getFullYear() !== ano ||
    dataObjeto.getMonth() !== mes - 1 ||
    dataObjeto.getDate() !== dia
  ) {
    return { valido: false, motivo: `A data [${dataLimpa}] não existe no calendário.` };
  }

  // Se passou por tudo, retorna o objeto Date pronto para uso e a string limpa
  return { 
    valido: true, 
    dataFormatada: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
    objetoDate: dataObjeto 
  };
}

module.exports = validarDataUsuario;