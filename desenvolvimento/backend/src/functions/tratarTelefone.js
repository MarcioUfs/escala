function formatarTelefone(telefone) {
  
  if (!telefone) {
    return "0";
  }

  const numerosLimpos = telefone.toString().replace(/\D/g, '');
  
  if (numerosLimpos.length !== 10 && numerosLimpos.length !== 11) {
    return "0";
  }

  if (numerosLimpos.length === 11) {
    return numerosLimpos.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else {
    return numerosLimpos.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
}
module.exports = formatarTelefone;