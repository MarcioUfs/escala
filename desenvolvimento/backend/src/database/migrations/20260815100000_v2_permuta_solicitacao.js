// Módulo de permuta com aprovação — fluxo de 3 partes:
//   1) solicitante pede a permuta com um dia/turno seu e um dia/turno do alvo
//   2) o alvo confirma (ou recusa, com motivo) que os dados batem
//   3) o admin analisa e aprova (gera as 2 linhas em v2_escala_substituicao,
//      uma pra cada data envolvida) ou rejeita
//
// v2_permuta_protocolo_contador guarda, por ano-mês, o último número usado
// — o protocolo final é "AAAAMM" + 6 dígitos crescentes (reinicia a cada
// mês), formato pedido pra rastreabilidade do evento.

exports.up = async function (knex) {
  await knex.schema.createTable("v2_permuta_protocolo_contador", function (table) {
    table.string("ano_mes", 6).primary(); // "202608"
    table.integer("ultimo_numero").notNullable().defaultTo(0);
  });

  await knex.schema.createTable("v2_permuta_solicitacao", function (table) {
    table.increments("id_permuta").primary();
    table.string("protocolo", 12).notNullable().unique(); // AAAAMM + 6 dígitos

    table
      .integer("fk_id_usuario_solicitante")
      .unsigned()
      .notNullable()
      .references("id_user")
      .inTable("users")
      .onDelete("CASCADE");
    table.date("data_solicitante").notNullable();
    table
      .integer("fk_id_turno_solicitante")
      .unsigned()
      .notNullable()
      .references("id_turno")
      .inTable("v2_turno")
      .onDelete("CASCADE");
    table
      .integer("fk_id_grupamento_solicitante")
      .unsigned()
      .notNullable()
      .references("id_grupamento")
      .inTable("v2_grupamento")
      .onDelete("CASCADE");

    table
      .integer("fk_id_usuario_alvo")
      .unsigned()
      .notNullable()
      .references("id_user")
      .inTable("users")
      .onDelete("CASCADE");
    table.date("data_alvo").notNullable();
    table
      .integer("fk_id_turno_alvo")
      .unsigned()
      .notNullable()
      .references("id_turno")
      .inTable("v2_turno")
      .onDelete("CASCADE");
    table
      .integer("fk_id_grupamento_alvo")
      .unsigned()
      .notNullable()
      .references("id_grupamento")
      .inTable("v2_grupamento")
      .onDelete("CASCADE");

    table.text("motivo_solicitacao").notNullable();
    table.string("status", 20).notNullable().defaultTo("AGUARDANDO_ALVO");
    table.text("motivo_recusa_alvo");

    table
      .integer("fk_id_admin_analise")
      .unsigned()
      .nullable()
      .references("id_admin")
      .inTable("admins")
      .onDelete("SET NULL");
    table.text("motivo_recusa_admin");

    // Ligação com as 2 linhas de substituição pontual criadas na aprovação
    // (uma pro dia do solicitante, outra pro dia do alvo) — permite achar
    // e reverter pela tela de escala já existente, sem duplicar lógica.
    table
      .integer("fk_id_substituicao_solicitante")
      .unsigned()
      .nullable()
      .references("id_substituicao")
      .inTable("v2_escala_substituicao")
      .onDelete("SET NULL");
    table
      .integer("fk_id_substituicao_alvo")
      .unsigned()
      .nullable()
      .references("id_substituicao")
      .inTable("v2_escala_substituicao")
      .onDelete("SET NULL");

    // Aviso: cada lado marca "lido" quando abre a tela de detalhe da
    // solicitação. O solicitante já sabe que acabou de criar (default
    // true); o alvo começa sem ler (default false) — é o gatilho do "aviso
    // ... próximo ao ícone de permuta do recebedor".
    table.boolean("lido_solicitante").notNullable().defaultTo(true);
    table.boolean("lido_alvo").notNullable().defaultTo(false);

    table.timestamps(true, true);
  });

  await knex.raw(`
    ALTER TABLE v2_permuta_solicitacao
    ADD CONSTRAINT chk_v2_permuta_status
    CHECK (status IN ('AGUARDANDO_ALVO','RECUSADA_ALVO','AGUARDANDO_ADMIN','APROVADA','RECUSADA_ADMIN'))
  `);

  await knex.raw(`
    ALTER TABLE v2_permuta_solicitacao
    ADD CONSTRAINT chk_v2_permuta_partes_diferentes
    CHECK (fk_id_usuario_solicitante <> fk_id_usuario_alvo)
  `);

  await knex.schema.alterTable("v2_permuta_solicitacao", function (table) {
    table.index(["fk_id_usuario_solicitante"], "idx_v2_permuta_solicitante");
    table.index(["fk_id_usuario_alvo"], "idx_v2_permuta_alvo");
    table.index(["status"], "idx_v2_permuta_status");
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("v2_permuta_solicitacao");
  await knex.schema.dropTableIfExists("v2_permuta_protocolo_contador");
};
