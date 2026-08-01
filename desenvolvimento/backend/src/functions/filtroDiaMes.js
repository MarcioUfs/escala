function processarFiltroMes(entrada) {
  
  const cleanInput = entrada ? entrada.trim() : "";

  const regex = /^(0[1-9]|1[0-2])-(\d{4})$/;
  const match = cleanInput.match(regex);

  if (!match) {
    throw new Error(
      "Formato de entrada inválido. O formato correto é 'MM-YYYY' (ex: '01-2026').",
    );
  }

  const mesStr = match[1]; 
  const ano = parseInt(match[2], 10); 
  const startDate = new Date();
  const endDate = new Date();
  const ultimoDia = new Date(ano, parseInt(mesStr, 10), 0).getDate();
  const ultimoDiaStr = String(ultimoDia).padStart(2, "0");

  return {
    startDate: `${ano}-${mesStr}-01T00:00:00-03:00`,
    endDate: `${ano}-${mesStr}-${ultimoDiaStr}T23:59:59.999-03:00`,
  };
}

module.exports = processarFiltroMes;
