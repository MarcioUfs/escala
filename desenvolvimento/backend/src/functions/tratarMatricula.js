function tratarMatricula(entrada) {
  let matriculaValida = entrada;
  let re = "";
  if (matriculaValida) {
    re = matriculaValida
      .replace(/\D/g, "")
      .replace(/(\d{10})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");

    let tamanho = re.length;
    if (tamanho < 13 || tamanho > 13) {
        return 0;
    }
    return re;
  } else {
    return 0;
  }
}
module.exports = tratarMatricula;
