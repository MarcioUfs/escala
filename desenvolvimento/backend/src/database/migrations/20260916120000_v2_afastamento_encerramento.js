// Encerramento manual de afastamento passa a exigir registro formal:
// data do encerramento, BGO de referência (número/ano) e motivo — além de
// quem (qual admin) efetuou a ação. Antes só existia o flag "ativo".

exports.up = async function (knex) {
  await knex.schema.alterTable("v2_afastamentos", function (table) {
    table.date("data_encerramento");
    table.string("bgo_encerramento", 9); // formato "NNN/AAAA", ex: "002/2026"
    table.text("motivo_encerramento");
    table
      .integer("fk_id_admin_encerramento")
      .unsigned()
      .nullable()
      .references("id_admin")
      .inTable("admins")
      .onDelete("SET NULL");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("v2_afastamentos", function (table) {
    table.dropColumn("data_encerramento");
    table.dropColumn("bgo_encerramento");
    table.dropColumn("motivo_encerramento");
    table.dropColumn("fk_id_admin_encerramento");
  });
};
