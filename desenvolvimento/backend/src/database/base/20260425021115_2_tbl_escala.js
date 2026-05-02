exports.up = async function (knex) {
  await knex.schema.dropTableIfExists("tbl_guarnicao");
  await knex.schema.dropTableIfExists("tbl_escala");

  await knex.schema.createTable("tbl_guarnicao", function (table) {
    table.increments("id_guarnicao").primary();
    table.date("data").notNullable();
    table.time("hora").notNullable();
    table.integer("dia");
    table.string("turno", 50);
    table.string("grupo", 10);
    table.string("funcao", 20);
    table.string("graduacao", 20);
    table.string("matricula", 20).notNullable().index();
    table.string("identificacao", 100);
    table.string("cpf", 11).notNullable().index();
    table.string("nome", 255).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("tbl_escala", function (table) {
    table.increments("id_escala").primary();
    table.string("nome_escala", 255).notNullable().unique();
    table.string("descricao_escala", 255);
    table.date("data_inicio").notNullable();
    table.date("data_fim").notNullable();
    table
      .integer("id_guarnicao")
      .unsigned()
      .nullable()
      .references("id_guarnicao")
      .inTable("tbl_guarnicao")
      .onDelete("SET NULL");
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });
};
//    table.timestamp("atualizado_em").defaultTo(knex.fn.now());
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("tbl_guarnicao");
  await knex.schema.dropTableIfExists("tbl_escala");
};
