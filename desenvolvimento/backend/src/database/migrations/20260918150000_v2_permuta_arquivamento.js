// Arquivamento de permutas por participante: cada lado (solicitante e alvo)
// arquiva a sua própria visão, sem afetar o outro. Permutas com o período
// encerrado (as duas datas já passaram) são tratadas como arquivadas na
// própria consulta, sem precisar de coluna.
exports.up = async function (knex) {
  await knex.schema.alterTable("v2_permuta_solicitacao", function (table) {
    table.boolean("arquivada_solicitante").notNullable().defaultTo(false);
    table.boolean("arquivada_alvo").notNullable().defaultTo(false);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("v2_permuta_solicitacao", function (table) {
    table.dropColumn("arquivada_solicitante");
    table.dropColumn("arquivada_alvo");
  });
};
