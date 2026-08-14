// Tabela de exceção pontual por dia — resolve o que v2_grupamento_usuario
// não cobre: um vínculo mensal (data_inicio/data_fim) não representa uma
// troca válida só por um dia. Cada linha aqui é um "desvio" registrado
// pra um data+turno específico, sem mexer no vínculo mensal de ninguém.
//
// tipo determina o significado de fk_id_usuario_sai/fk_id_usuario_entra:
//   ADICAO   -> só fk_id_usuario_entra preenchido (alguém extra naquele dia)
//   EXCLUSAO -> só fk_id_usuario_sai preenchido (alguém de folga naquele dia)
//   PERMUTA  -> os dois preenchidos (troca entre duas pessoas naquele dia)
//
// Reverter uma exceção = apagar a linha (não é soft delete; a ausência da
// linha já significa "sem desvio, vale o vínculo mensal normal").

exports.up = async function (knex) {
  await knex.schema.createTable("v2_escala_substituicao", function (table) {
    table.increments("id_substituicao").primary();
    table.date("data").notNullable();
    table
      .integer("fk_id_turno")
      .unsigned()
      .notNullable()
      .references("id_turno")
      .inTable("v2_turno")
      .onDelete("CASCADE");
    table
      .integer("fk_id_grupamento")
      .unsigned()
      .notNullable()
      .references("id_grupamento")
      .inTable("v2_grupamento")
      .onDelete("CASCADE");
    table
      .integer("fk_id_usuario_sai")
      .unsigned()
      .nullable()
      .references("id_user")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("fk_id_usuario_entra")
      .unsigned()
      .nullable()
      .references("id_user")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("tipo", 15).notNullable();
    table.text("observacao");
    table
      .integer("fk_id_admin")
      .unsigned()
      .nullable()
      .references("id_admin")
      .inTable("admins")
      .onDelete("SET NULL");
    table.timestamps(true, true);
  });

  await knex.raw(`
    ALTER TABLE v2_escala_substituicao
    ADD CONSTRAINT chk_v2_sub_tipo CHECK (tipo IN ('ADICAO','EXCLUSAO','PERMUTA'))
  `);

  // Pelo menos um dos dois lados precisa existir — uma linha sem ninguém
  // saindo nem entrando não representa desvio nenhum.
  await knex.raw(`
    ALTER TABLE v2_escala_substituicao
    ADD CONSTRAINT chk_v2_sub_algum_usuario
    CHECK (fk_id_usuario_sai IS NOT NULL OR fk_id_usuario_entra IS NOT NULL)
  `);

  await knex.schema.alterTable("v2_escala_substituicao", function (table) {
    table.index(["data", "fk_id_turno"], "idx_v2_sub_data_turno");
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("v2_escala_substituicao");
};
