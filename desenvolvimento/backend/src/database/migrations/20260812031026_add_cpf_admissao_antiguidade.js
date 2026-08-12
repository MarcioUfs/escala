// Adiciona campos que a nova API de antiguidade passou a fornecer e que
// a tabela antiga não tinha: CPF (permite casar este registro com um
// usuário real do sistema pra pré-cadastro) e data de admissão.
// Não mexe em nenhuma outra tabela nem remove nada existente.

exports.up = function (knex) {
  return knex.schema.alterTable("efetivo_antiguidade", function (table) {
    table.string("cpf", 11).nullable();
    table.string("data_admissao").nullable();
    table.index("cpf", "idx_efetivo_antiguidade_cpf");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("efetivo_antiguidade", function (table) {
    table.dropIndex("cpf", "idx_efetivo_antiguidade_cpf");
    table.dropColumn("cpf");
    table.dropColumn("data_admissao");
  });
};