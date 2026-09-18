// Valida CPF pelo algoritmo oficial dos dígitos verificadores. Recebe só
// dígitos (sem máscara) — quem chama já deve ter limpo o valor antes.
function validarCPF(cpf) {
  if (typeof cpf !== "string" || !/^\d{11}$/.test(cpf)) {
    return false;
  }

  // CPFs com todos os dígitos iguais (ex: 111.111.111-11) passam na conta
  // dos dígitos verificadores mas nunca são válidos na prática.
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  for (let posicaoDigito = 9; posicaoDigito <= 10; posicaoDigito++) {
    let soma = 0;
    for (let i = 0; i < posicaoDigito; i++) {
      soma += parseInt(cpf[i], 10) * (posicaoDigito + 1 - i);
    }
    const resto = (soma * 10) % 11;
    const digitoEsperado = resto === 10 ? 0 : resto;
    if (digitoEsperado !== parseInt(cpf[posicaoDigito], 10)) {
      return false;
    }
  }

  return true;
}

module.exports = validarCPF;
