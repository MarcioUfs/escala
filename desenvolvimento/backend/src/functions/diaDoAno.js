const { getDayOfYear, parseISO, isValid } = require('date-fns');

function calcularDiaDoAno(dataFrontend) {
  try {
    if (!dataFrontend) return 999;

    const dataObjeto = typeof dataFrontend === 'string' 
      ? parseISO(dataFrontend) 
      : new Date(dataFrontend);

    if (!isValid(dataObjeto)) {
      return 999;
    }

    return getDayOfYear(dataObjeto);

  } catch (error) {
    console.error("[E-Escala] Erro ao calcular dia do ano. Aplicando fallback 999:", error.message);
    return 999;
  }
}

// ==========================================
// TESTES DO FALLBACK:
// ==========================================

console.log(calcularDiaDoAno('2026-02-01'));       // Sucesso: Retorna 32
console.log(calcularDiaDoAno(null));               // Falha: Retorna 999
console.log(calcularDiaDoAno('data-invalida'));    // Falha: Retorna 999
console.log(calcularDiaDoAno(''));                 // Falha: Retorna 999