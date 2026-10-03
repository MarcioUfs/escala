const bcryptjs = require("bcryptjs");

// Hash bcrypt válido de um valor que nunca é senha de ninguém de verdade —
// gerado uma vez (custo 10, igual ao resto do projeto) e reaproveitado.
// Serve só para a comparação rodar na mesma faixa de tempo de uma
// comparação real mesmo quando o CPF não existe no banco. Sem isso, o
// login responde bem mais rápido pra CPF inexistente (nunca chega a
// rodar o bcrypt) do que pra CPF existente com senha errada — diferença
// medível que, somada à mensagem genérica, ainda vazaria quais CPFs
// estão cadastrados.
const HASH_FICTICIO = "$2b$10$Hk5j8v8.6tVpS20Q4UUliu41vxsVBYj3ObaJ1kwYpb5zC6T7KZpHm";

// Confere a senha digitada contra o hash do registro encontrado — ou,
// se o registro não existe (hashReal undefined/null), contra o hash
// fictício, pra gastar o mesmo tempo de CPU nos dois casos. O retorno
// nunca diferencia "não existe" de "senha errada": quem chama deve usar
// a mesma mensagem genérica para os dois.
async function senhaConfere(hashReal, senhaDigitada) {
  return bcryptjs.compare(senhaDigitada, hashReal || HASH_FICTICIO);
}

module.exports = { senhaConfere };
