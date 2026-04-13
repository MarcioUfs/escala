exports.up = async function (knex) {
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("admins");
  await knex.schema.dropTableIfExists("efetivo_antiguidade");
  await knex.schema.dropTableIfExists("guarnicoes");
  await knex.schema.dropTableIfExists("modelos_escala");
  await knex.schema.dropTableIfExists("escalas");
  await knex.schema.dropTableIfExists("escala_itens");
  await knex.schema.dropTableIfExists("escala_item_militares");

  await knex.schema.createTable("users", function (table) {
    table.increments("id_user").primary();
    table.string("email", 255).notNullable().unique();
    table.string("password", 255).notNullable();
    table.string("nome", 255).notNullable();
    table.string("cpf", 14).notNullable().unique();
    table.string("matricula", 255).notNullable().unique();
    table.string("telefone", 255);
    table.boolean("is_active").defaultTo(true);
    table.string("role", 255).notNullable().defaultTo("user");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("admins", function (table) {
    table.increments("id_admin").primary();
    table.string("password", 255).notNullable();
    table.string("nome", 255).notNullable();
    table.string("cpf", 14).notNullable().unique();
    table.string("role", 255).notNullable().defaultTo("admin");
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
  
  await knex.schema.createTable("guarnicoes", function (table) {
    table.increments("id").primary();
    table.string("nome", 150).notNullable();
    table.string("codigo", 50).notNullable().unique();
    table.integer("capacidade_maxima").notNullable();
    table.text("descricao").nullable();
    table.boolean("ativo").notNullable().defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

    await knex.schema.createTable("modelos_escala", function (table) {
    table.increments("id").primary();
    table.string("codigo", 50).notNullable().unique();
    table.string("nome", 150).notNullable();
    table.text("descricao").nullable();
    table.boolean("ativo").notNullable().defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("escalas", function (table) {
    table.increments("id").primary();
    table.string("nome", 150).notNullable();
    table.integer("ano").notNullable();
    table.integer("mes").notNullable();

    table
      .integer("id_guarnicao")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("guarnicoes")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table
      .integer("id_modelo_escala")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("modelos_escala")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table
      .integer("id_admin_criador")
      .unsigned()
      .nullable()
      .references("id_admin")
      .inTable("admins")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("escala_itens", function (table) {
    table.increments("id").primary();

    table
      .integer("id_escala")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("escalas")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table
      .integer("id_guarnicao")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("guarnicoes")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table.integer("dia_linear").notNullable();
    table.date("data_referencia").notNullable();

    table.string("turno_nome", 50).notNullable();
    table.string("tipo_servico", 50).notNullable();

    table.string("hora_inicio", 5).notNullable();
    table.string("hora_fim", 5).notNullable();

    table.timestamp("data_inicio").notNullable();
    table.timestamp("data_fim").notNullable();

    table.integer("capacidade_prevista").notNullable();
    table.text("observacao").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("escala_item_militares", function (table) {
    table.increments("id").primary();

    table
      .integer("id_escala_item")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("escala_itens")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table
      .integer("id_user")
      .unsigned()
      .notNullable()
      .references("id_user")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table.string("nome_militar_snapshot", 150).nullable();
    table.string("matricula_militar_snapshot", 50).nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("efetivo_antiguidade");
  await knex.schema.dropTableIfExists("admins");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("guarnicoes");
  await knex.schema.dropTableIfExists("modelos_escala");
  await knex.schema.dropTableIfExists("escalas");
  await knex.schema.dropTableIfExists("escala_itens");
  await knex.schema.dropTableIfExists("escala_item_militares");
};


////
// exports.up = async function (knex) {
//   await knex.schema.createTable("guarnicoes", function (table) {
//     table.increments("id").primary();
//     table.string("nome", 150).notNullable();
//     table.string("codigo", 50).notNullable().unique();
//     table.integer("capacidade_maxima").notNullable();
//     table.text("descricao").nullable();
//     table.boolean("ativo").notNullable().defaultTo(true);
//     table.timestamp("created_at").defaultTo(knex.fn.now());
//     table.timestamp("updated_at").defaultTo(knex.fn.now());
//   });
// };

// exports.down = async function (knex) {
//   await knex.schema.dropTable("guarnicoes");
// };

// exports.up = async function (knex) {
//   await knex.schema.createTable("modelos_escala", function (table) {
//     table.increments("id").primary();
//     table.string("codigo", 50).notNullable().unique();
//     table.string("nome", 150).notNullable();
//     table.text("descricao").nullable();
//     table.boolean("ativo").notNullable().defaultTo(true);
//     table.timestamp("created_at").defaultTo(knex.fn.now());
//     table.timestamp("updated_at").defaultTo(knex.fn.now());
//   });
// };

// exports.down = async function (knex) {
//   await knex.schema.dropTable("modelos_escala");
// };

// exports.up = async function (knex) {
//   await knex.schema.createTable("modelos_escala", function (table) {
//     table.increments("id").primary();
//     table.string("codigo", 50).notNullable().unique();
//     table.string("nome", 150).notNullable();
//     table.text("descricao").nullable();
//     table.boolean("ativo").notNullable().defaultTo(true);
//     table.timestamp("created_at").defaultTo(knex.fn.now());
//     table.timestamp("updated_at").defaultTo(knex.fn.now());
//   });
// };

// exports.down = async function (knex) {
//   await knex.schema.dropTable("modelos_escala");
// };

// exports.up = async function (knex) {
//   await knex.schema.createTable("escalas", function (table) {
//     table.increments("id").primary();
//     table.string("nome", 150).notNullable();
//     table.integer("ano").notNullable();
//     table.integer("mes").notNullable();

//     table
//       .integer("id_guarnicao")
//       .unsigned()
//       .notNullable()
//       .references("id")
//       .inTable("guarnicoes")
//       .onDelete("RESTRICT")
//       .onUpdate("CASCADE");

//     table
//       .integer("id_modelo_escala")
//       .unsigned()
//       .notNullable()
//       .references("id")
//       .inTable("modelos_escala")
//       .onDelete("RESTRICT")
//       .onUpdate("CASCADE");

//     table
//       .integer("id_admin_criador")
//       .unsigned()
//       .nullable()
//       .references("id_admin")
//       .inTable("admins")
//       .onDelete("SET NULL")
//       .onUpdate("CASCADE");

//     table.timestamp("created_at").defaultTo(knex.fn.now());
//     table.timestamp("updated_at").defaultTo(knex.fn.now());
//   });
// };

// exports.down = async function (knex) {
//   await knex.schema.dropTable("escalas");
// };

// exports.up = async function (knex) {
//   await knex.schema.createTable("escala_itens", function (table) {
//     table.increments("id").primary();

//     table
//       .integer("id_escala")
//       .unsigned()
//       .notNullable()
//       .references("id")
//       .inTable("escalas")
//       .onDelete("CASCADE")
//       .onUpdate("CASCADE");

//     table
//       .integer("id_guarnicao")
//       .unsigned()
//       .notNullable()
//       .references("id")
//       .inTable("guarnicoes")
//       .onDelete("RESTRICT")
//       .onUpdate("CASCADE");

//     table.integer("dia_linear").notNullable();
//     table.date("data_referencia").notNullable();

//     table.string("turno_nome", 50).notNullable();
//     table.string("tipo_servico", 50).notNullable();

//     table.string("hora_inicio", 5).notNullable();
//     table.string("hora_fim", 5).notNullable();

//     table.timestamp("data_inicio").notNullable();
//     table.timestamp("data_fim").notNullable();

//     table.integer("capacidade_prevista").notNullable();
//     table.text("observacao").nullable();

//     table.timestamp("created_at").defaultTo(knex.fn.now());
//     table.timestamp("updated_at").defaultTo(knex.fn.now());
//   });
// };

// exports.down = async function (knex) {
//   await knex.schema.dropTable("escala_itens");
// };

// exports.up = async function (knex) {
//   await knex.schema.createTable("escala_item_militares", function (table) {
//     table.increments("id").primary();

//     table
//       .integer("id_escala_item")
//       .unsigned()
//       .notNullable()
//       .references("id")
//       .inTable("escala_itens")
//       .onDelete("CASCADE")
//       .onUpdate("CASCADE");

//     table
//       .integer("id_user")
//       .unsigned()
//       .notNullable()
//       .references("id_user")
//       .inTable("users")
//       .onDelete("RESTRICT")
//       .onUpdate("CASCADE");

//     table.string("nome_militar_snapshot", 150).nullable();
//     table.string("matricula_militar_snapshot", 50).nullable();

//     table.timestamp("created_at").defaultTo(knex.fn.now());
//     table.timestamp("updated_at").defaultTo(knex.fn.now());
//   });
// };

// exports.down = async function (knex) {
//   await knex.schema.dropTable("escala_item_militares");
// };



