exports.up = async function (knex) {
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("admins");
  await knex.schema.dropTableIfExists("efetivo_antiguidade");

  await knex.schema.createTable("users", function (table) {
    table.increments("id_user").primary();
    table.string("email", 255).notNullable().unique();
    table.string("password", 255).notNullable();
    table.string("cpf", 14).notNullable().unique();
    table.string("nome", 255).notNullable();
    table.string("matricula", 255).notNullable().unique();
    table.string("role", 255).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("admins", function (table) {
    table.increments("id_admin").primary();
    table.string("email", 255).notNullable().unique();
    table.string("password", 255).notNullable();
    table.string("cpf", 14).notNullable().unique();
    table.string("nome", 255).notNullable();
    table.string("matricula", 255).notNullable().unique();
    table.string("role", 255).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("efetivo_antiguidade", function (table) {
    table.increments("id").primary();
    table.string("matricula").notNullable().unique();
    table.string("antiguidade").notNullable();
    table.integer("ordem").notNullable().unique();
    table.string("patente").notNullable();
    table.string("quadro").notNullable();
    table.string("nome").notNullable();
    table.string("data_promocao").notNullable();
    table.string("tempo_promocao").notNullable();
    table.timestamp("atualizado_em").defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("efetivo_antiguidade");
  await knex.schema.dropTableIfExists("admins");
  await knex.schema.dropTableIfExists("users");
};