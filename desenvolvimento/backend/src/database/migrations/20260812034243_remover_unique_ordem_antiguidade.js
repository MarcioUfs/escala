// A API confirmou na prática que "ordem" pode se repetir entre
// militares diferentes (empate de antiguidade no critério do próprio
// site). "matricula" já garante identidade única de cada registro, então
// remove a exigência de unicidade em "ordem" — ela continua armazenada
// exatamente como vem do site, só deixa de ser uma constraint de banco.

exports.up = function (knex) {
  return knex.raw(
    "ALTER TABLE efetivo_antiguidade DROP CONSTRAINT efetivo_antiguidade_ordem_unique",
  );
};

exports.down = function (knex) {
  return knex.schema.alterTable("efetivo_antiguidade", function (table) {
    table.unique("ordem");
  });
};