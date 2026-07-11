exports.up = async function (knex) {
  await knex.schema.dropTableIfExists("tbl_patentes");

  await knex.schema.createTable("tbl_patentes", function (table) {
    table.increments("id_patente").primary();
    table.string("nome_patente", 255).notNullable().unique();
    table.string("sigla_patente", 255).notNullable().unique();
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("tbl_patentes");
};
