exports.up = async function (knex) {
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("admins");
  await knex.schema.dropTableIfExists("master");
  await knex.schema.dropTableIfExists("efetivo_antiguidade");
  await knex.schema.dropTableIfExists("escalas_servicos");
  await knex.schema.dropTableIfExists("tbl_guarnicao");
  await knex.schema.dropTableIfExists("tbl_escala");

  await knex.schema.createTable("users", function (table) {
    table.increments("id_user").primary();
    table.string("email", 255).notNullable().unique();
    table.string("password", 255).notNullable();
    table.string("nome", 255).notNullable();
    table.string("cpf", 11).notNullable().unique();
    table.string("matricula", 255).notNullable().unique();
    table.string("telefone", 255);
    table.string("nome_guerra", 255).notNullable();
    table.boolean("is_active").defaultTo(true);
    table.string("role", 255).notNullable().defaultTo("user");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("admins", function (table) {
    table.increments("id_admin").primary();
    table.string("password", 255).notNullable();
    table.string("nome", 255).notNullable();
    table.string("cpf", 11).notNullable().unique();
    table.string("role", 255).notNullable().defaultTo("admin");
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });
    await knex.schema.createTable("master", function (table) {
    table.increments("id_master").primary();
    table.string("password", 255).notNullable();
    table.string("Master", 255).notNullable();
    table.string("cpf", 11).notNullable().unique();
    table.string("role", 255).notNullable().defaultTo("master");
    table.boolean("is_active").defaultTo(true);
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

  await knex.schema.createTable("escalas_servicos", function (table) {
    table.increments("id").primary();
    table.string("nome").notNullable();
    table.text("descricao");
    table.date("data_inicio").notNullable();
    table.date("data_fim").notNullable();
    table.jsonb("guarnicoes_do_dia").notNullable();
    table.jsonb("administrador").notNullable();
    table.boolean("status").defaultTo(true);
    table.timestamps(true, true);
    table.integer("efetivo_por_guarnicao").notNullable();
  });

  await knex.schema.createTable("tbl_guarnicao", function (table) {
    table.increments("id_guarnicao").primary();
    table.date("data_guarnicao").notNullable();
    table.time("hora_guarnicao").notNullable();
    table.jsonb("dados_guarnicao").notNullable();
    table.integer("dayofyear").notNullable();
    table.integer("turno").notNullable(); // 1,2,3 ou 4
    table.string("grupamento", 10).notNullable(); //A,B,C,D,E,F
    table.timestamps(true, true);
  });

  await knex.schema.createTable("tbl_escala", function (table) {
    table.increments("id_escala").primary();
    table.string("nome_escala", 255).notNullable().unique();
    table.string("descricao_escala", 255);
    table.date("data_inicio").notNullable();
    table.date("data_fim").notNullable();
    table
      .integer("fk_id_guarnicao")
      .unsigned()
      .nullable()
      .references("id_guarnicao")
      .inTable("tbl_guarnicao")
      .onDelete("SET NULL");
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("efetivo_antiguidade");
  await knex.schema.dropTableIfExists("admins");
  await knex.schema.dropTableIfExists("master");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("escalas_servicos");
  await knex.schema.dropTableIfExists("tbl_guarnicao");
  await knex.schema.dropTableIfExists("tbl_escala");
};
