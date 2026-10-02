const database = require("../database/db");

// -----------------------------------------------------------------------
// Autorização dentro do WHERE, não num "if" depois da consulta.
//
// A diferença importa: buscar a linha solta e só então comparar o dono
// deixa a autorização por conta de uma checagem que alguém pode esquecer
// de escrever. Aqui a própria consulta já não enxerga o que não é do
// usuário — esquecer a checagem deixa de ser possível, porque não existe
// checagem separada.
//
// As duas funções devolvem um query builder do knex (não o resultado), e é
// de propósito: o MESMO escopo serve para ler (.first()) e para gravar
// (.update()). Sem isso, a janela entre o SELECT e o UPDATE continuaria
// aberta, porque o UPDATE voltaria a mirar o id puro.
//
// Quando o usuário não é parte da permuta, a consulta simplesmente não
// devolve nada — e a rota responde 404, igual a uma permuta inexistente.
// Isso é intencional: responder 403 ("não é sua") confirmaria que aquela
// permuta existe, o que permite mapear o sistema testando ids em sequência.
// -----------------------------------------------------------------------

// Só o militar ALVO da solicitação (quem precisa confirmar ou recusar).
function escopoComoAlvo(idPermuta, idUsuario) {
  return database("v2_permuta_solicitacao")
    .where({ id_permuta: idPermuta })
    .andWhere("fk_id_usuario_alvo", idUsuario);
}

// Qualquer um dos dois lados — usado onde ambos podem agir sobre a própria
// visão (marcar como lida, arquivar, desarquivar). Quem chama ainda precisa
// saber QUAL dos dois é, para escolher a coluna certa; a linha devolvida
// traz os dois campos para isso.
function escopoComoParticipante(idPermuta, idUsuario) {
  return database("v2_permuta_solicitacao")
    .where({ id_permuta: idPermuta })
    .andWhere(function () {
      this.where("fk_id_usuario_solicitante", idUsuario).orWhere("fk_id_usuario_alvo", idUsuario);
    });
}

module.exports = { escopoComoAlvo, escopoComoParticipante };
