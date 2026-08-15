// Gera o protocolo de uma solicitação de permuta: "AAAAMM" + 6 dígitos
// crescentes, reiniciando a cada mês (ex: 202608000001, 202608000002, ...).
//
// Usa INSERT ... ON CONFLICT DO UPDATE ... RETURNING pra incrementar o
// contador do mês de forma atômica — evita duas solicitações simultâneas
// saírem com o mesmo número (o que uma leitura + escrita separada não
// garantiria). Precisa rodar dentro da mesma transação do INSERT da
// solicitação, pra reverter o número junto se o resto da operação falhar.
async function gerarProtocoloPermuta(trx) {
  const agora = new Date();
  const anoMes = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, "0")}`;

  const resultado = await trx.raw(
    `
    INSERT INTO v2_permuta_protocolo_contador (ano_mes, ultimo_numero)
    VALUES (?, 1)
    ON CONFLICT (ano_mes)
    DO UPDATE SET ultimo_numero = v2_permuta_protocolo_contador.ultimo_numero + 1
    RETURNING ultimo_numero
    `,
    [anoMes],
  );

  const ultimoNumero = resultado.rows[0].ultimo_numero;
  return `${anoMes}${String(ultimoNumero).padStart(6, "0")}`;
}

module.exports = gerarProtocoloPermuta;
