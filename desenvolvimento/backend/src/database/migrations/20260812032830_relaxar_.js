// A API de antiguidade confirmou na prática que "tempo_promocao" (e,
// pelo mesmo motivo, provavelmente "data_promocao", "patente" e
// "quadro") pode vir vazia — típico de militares recém-admitidos que
// ainda não tiveram nenhuma promoção. Mantém matricula/nome/ordem como
// obrigatórias (identidade básica, sempre devem existir), relaxa o
// resto.

exports.up = function (knex) {
  return knex.schema.alterTable("efetivo_antiguidade", function (table) {
    table.string("antiguidade").nullable().alter();
    table.string("patente").nullable().alter();
    table.string("quadro").nullable().alter();
    table.string("data_promocao").nullable().alter();
    table.string("tempo_promocao").nullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("efetivo_antiguidade", function (table) {
    table.string("antiguidade").notNullable().alter();
    table.string("patente").notNullable().alter();
    table.string("quadro").notNullable().alter();
    table.string("data_promocao").notNullable().alter();
    table.string("tempo_promocao").notNullable().alter();
  });
};