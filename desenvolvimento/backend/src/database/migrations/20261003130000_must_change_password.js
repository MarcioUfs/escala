// S4 da auditoria de segurança: todo militar novo nasce com a MESMA senha
// (SEED_PASS), igual para todo mundo, e nada nunca obrigava a troca depois
// do primeiro acesso -- quem descobrisse o valor de SEED_PASS conseguia
// entrar como qualquer CPF que ainda não tivesse trocado.
//
// Default `true` (não `false`) de propósito: não existe hoje nenhum
// registro de quem já trocou a senha desde que foi criado, então o
// default seguro é assumir que ninguém trocou ainda -- força a troca pra
// todo mundo, inclusive contas já existentes, em vez de confiar em uma
// suposição otimista.
exports.up = function (knex) {
  return knex.schema.alterTable("users", function (table) {
    table.boolean("must_change_password").notNullable().defaultTo(true);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("users", function (table) {
    table.dropColumn("must_change_password");
  });
};
