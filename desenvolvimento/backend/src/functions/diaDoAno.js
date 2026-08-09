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
    return 999;
  }
}
