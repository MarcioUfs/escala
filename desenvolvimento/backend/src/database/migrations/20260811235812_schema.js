// Migration consolidada — recria o schema inteiro do zero.
//
// Substitui os 4 arquivos anteriores:
//   20260706151248_schema.js
//   20260706160303_patente.js
//   20260706172324_add_patente_to_users.js
//   20260801212554_v2_cl.js
//
// Mudança principal: a tabela v2_usuario foi REMOVIDA. "users" passa a
// ser a única referência de pessoa no projeto — inclusive pro módulo de
// escala (v2_grupamento_usuario.fk_id_usuario -> users.id_user).
// A coluna id_patente já nasce dentro de "users" (não precisa mais da
// migration separada de ALTER TABLE que existia antes).
//
// tbl_setores, admins, tbl_escala, masters, efetivo_antiguidade,
// tbl_guarnicao, tbl_escala_admin_autorizados e tbl_patentes continuam
// exatamente como estavam (efetivo_antiguidade não é usada pelo módulo
// de escala hoje, mas foi mantida por já ter uso futuro definido).

exports.up = async function (knex) {
  await knex.raw("CREATE EXTENSION IF NOT EXISTS btree_gist");

  // ---------------------------------------------------------------
  // Limpeza — permite rodar a migration a partir de um banco zerado
  // ---------------------------------------------------------------
  await knex.raw("DROP VIEW IF EXISTS vw_v2_escala_usuarios");
  await knex.raw("DROP FUNCTION IF EXISTS fn_v2_gerar_escala(date, date)");
  await knex.raw("DROP FUNCTION IF EXISTS fn_v2_dia_ciclo(date)");

  await knex.schema.dropTableIfExists("v2_escala");
  await knex.schema.dropTableIfExists("v2_ciclo_escala_config");
  await knex.schema.dropTableIfExists("v2_ciclo_escala");
  await knex.schema.dropTableIfExists("v2_grupamento_usuario");
  await knex.schema.dropTableIfExists("v2_usuario"); // legado — não é mais criada
  await knex.schema.dropTableIfExists("v2_grupamento");
  await knex.schema.dropTableIfExists("v2_turno");

  await knex.schema.dropTableIfExists("tbl_escala_admin_autorizados");
  await knex.schema.dropTableIfExists("tbl_guarnicao");
  await knex.schema.dropTableIfExists("efetivo_antiguidade");
  await knex.schema.dropTableIfExists("masters");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("tbl_escala");
  await knex.schema.dropTableIfExists("admins");
  await knex.schema.dropTableIfExists("tbl_patentes");
  await knex.schema.dropTableIfExists("tbl_setores");

  // ---------------------------------------------------------------
  // TABELAS BASE (sem dependência de outras)
  // ---------------------------------------------------------------
  await knex.schema.createTable("tbl_setores", function (table) {
    table.increments("id_setor").primary();
    table.string("nome_setor", 255).notNullable().unique();
    table.string("sigla", 255).notNullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("tbl_patentes", function (table) {
    table.increments("id_patente").primary();
    table.string("nome_patente", 255).notNullable().unique();
    table.string("sigla_patente", 255).notNullable().unique();
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  // ---------------------------------------------------------------
  // ADMINS / ESCALA v1 (legado, mantido em uso)
  // ---------------------------------------------------------------
  await knex.schema.createTable("admins", function (table) {
    table.increments("id_admin").primary();
    table.string("password", 255).notNullable();
    table.string("nome", 255).notNullable();
    table.string("cpf", 11).notNullable().unique();
    table.string("role", 255).notNullable().defaultTo("admin");
    table
      .integer("fk_id_setor")
      .unsigned()
      .nullable()
      .references("id_setor")
      .inTable("tbl_setores")
      .onDelete("SET NULL");
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("tbl_escala", function (table) {
    table.increments("id_escala").primary();
    table.string("nome_escala", 255).notNullable().unique();
    table.string("descricao_escala", 255);
    table.date("data_inicio").notNullable();
    table.date("data_fim").notNullable();
    table
      .integer("fk_id_setor")
      .unsigned()
      .nullable()
      .references("id_setor")
      .inTable("tbl_setores")
      .onDelete("SET NULL");
    table
      .integer("fk_id_admin")
      .unsigned()
      .nullable()
      .references("id_admin")
      .inTable("admins")
      .onDelete("SET NULL");
    table.jsonb("admins_autorizados");
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  // ---------------------------------------------------------------
  // USERS — referência única de pessoa no projeto (substitui v2_usuario)
  // id_patente já nasce aqui (antes era uma migration de ALTER separada)
  // ---------------------------------------------------------------
  await knex.schema.createTable("users", function (table) {
    table.increments("id_user").primary();
    table.string("email", 255).notNullable().unique();
    table.string("password", 255).notNullable();
    table.string("nome", 255).notNullable();
    table
      .integer("id_patente")
      .unsigned()
      .nullable()
      .references("id_patente")
      .inTable("tbl_patentes")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");
    table.string("cpf", 11).notNullable().unique();
    table.string("matricula", 255).notNullable().unique();
    table.string("telefone", 255);
    table.string("nome_guerra", 255).notNullable();
    table.boolean("is_active").defaultTo(true);
    table.string("role", 255).notNullable().defaultTo("user");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("masters", function (table) {
    table.increments("id_master").primary();
    table.string("password", 255).notNullable();
    table.string("nome", 255).notNullable();
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

  await knex.schema.createTable("tbl_guarnicao", function (table) {
    table.increments("id_guarnicao").primary();
    table.date("data_guarnicao").notNullable();
    table.time("hora_guarnicao").notNullable();
    table.jsonb("dados_guarnicao").notNullable();
    table.integer("dayofyear").notNullable();
    table.integer("turno").notNullable();
    table.string("grupamento", 10).notNullable();
    table
      .integer("fk_id_escala")
      .unsigned()
      .notNullable()
      .references("id_escala")
      .inTable("tbl_escala")
      .onDelete("CASCADE");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("tbl_escala_admin_autorizados", function (table) {
    table.increments("id_escala_admin_autorizado").primary();
    table
      .integer("fk_id_escala")
      .unsigned()
      .nullable()
      .references("id_escala")
      .inTable("tbl_escala")
      .onDelete("SET NULL");
    table
      .integer("fk_id_admin")
      .unsigned()
      .nullable()
      .references("id_admin")
      .inTable("admins")
      .onDelete("SET NULL");
  });

  // ---------------------------------------------------------------
  // MÓDULO DE ESCALA (v2)
  // ---------------------------------------------------------------
  await knex.schema.createTable("v2_turno", function (table) {
    table.increments("id_turno").primary();
    table.integer("numero").notNullable().unique(); // 1, 2 ou 3
    table.string("descricao", 30).notNullable();
    table.time("hora_inicio").notNullable();
    table.time("hora_fim").notNullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });
  await knex.raw(`
    ALTER TABLE v2_turno
    ADD CONSTRAINT chk_v2_turno_numero CHECK (numero BETWEEN 1 AND 3)
  `);

  await knex.schema.createTable("v2_grupamento", function (table) {
    table.increments("id_grupamento").primary();
    table.string("sigla", 1).notNullable().unique(); // A,B,C,D,E,F
    table.string("nome", 50).notNullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });
  await knex.raw(`
    ALTER TABLE v2_grupamento
    ADD CONSTRAINT chk_v2_grupamento_sigla CHECK (sigla IN ('A','B','C','D','E','F'))
  `);

  // v2_grupamento_usuario agora referencia "users" diretamente
  // (v2_usuario foi removida). fk_id_usuario -> users.id_user
  await knex.schema.createTable("v2_grupamento_usuario", function (table) {
    table.increments("id_grupamento_usuario").primary();
    table
      .integer("fk_id_grupamento")
      .unsigned()
      .notNullable()
      .references("id_grupamento")
      .inTable("v2_grupamento")
      .onDelete("CASCADE");
    table
      .integer("fk_id_usuario")
      .unsigned()
      .notNullable()
      .references("id_user")
      .inTable("users")
      .onDelete("CASCADE");
    table.date("data_inicio").notNullable();
    table.date("data_fim"); // null = vínculo vigente
    table.timestamps(true, true);
  });
  await knex.raw(`
    ALTER TABLE v2_grupamento_usuario
    ADD CONSTRAINT chk_v2_gu_periodo CHECK (data_fim IS NULL OR data_fim >= data_inicio)
  `);
  await knex.raw(`
    ALTER TABLE v2_grupamento_usuario
    ADD CONSTRAINT excl_v2_gu_periodo
    EXCLUDE USING gist (
      fk_id_usuario WITH =,
      daterange(data_inicio, COALESCE(data_fim, 'infinity'::date), '[]') WITH &&
    )
  `);

  await knex.schema.createTable("v2_ciclo_escala", function (table) {
    table.increments("id_ciclo").primary();
    table.integer("dia_ciclo").notNullable(); // 1 a 6
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
    table.unique(["dia_ciclo", "fk_id_turno"]);
    table.timestamps(true, true);
  });
  await knex.raw(`
    ALTER TABLE v2_ciclo_escala
    ADD CONSTRAINT chk_v2_ciclo_dia CHECK (dia_ciclo BETWEEN 1 AND 6)
  `);

  await knex.schema.createTable("v2_ciclo_escala_config", function (table) {
    table.integer("id_config").primary().defaultTo(1);
    table.date("data_referencia").notNullable(); // data em que dia_ciclo = 1
    table.timestamps(true, true);
  });
  await knex.raw(`
    ALTER TABLE v2_ciclo_escala_config
    ADD CONSTRAINT chk_v2_config_singleton CHECK (id_config = 1)
  `);

  await knex.schema.createTable("v2_escala", function (table) {
    table.increments("id_escala").primary();
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
    table.string("origem", 15).notNullable().defaultTo("CICLO");
    table.text("observacao");
    table.unique(["data", "fk_id_turno"]);
    table.timestamps(true, true);
  });
  await knex.raw(`
    ALTER TABLE v2_escala
    ADD CONSTRAINT chk_v2_escala_origem CHECK (origem IN ('CICLO','AJUSTE_MANUAL'))
  `);
  await knex.schema.alterTable("v2_escala", function (table) {
    table.index("data", "idx_v2_escala_data");
    table.index("fk_id_grupamento", "idx_v2_escala_grupamento");
  });

  // ---------------------------------------------------------------
  // Função: calcula o dia do ciclo (1-6) para qualquer data
  // ---------------------------------------------------------------
  await knex.raw(`
    CREATE OR REPLACE FUNCTION fn_v2_dia_ciclo(p_data DATE)
    RETURNS SMALLINT AS $$
    DECLARE
      v_ref  DATE;
      v_dias INT;
    BEGIN
      SELECT data_referencia INTO v_ref FROM v2_ciclo_escala_config WHERE id_config = 1;
      v_dias := (p_data - v_ref) % 6;
      IF v_dias < 0 THEN
        v_dias := v_dias + 6;
      END IF;
      RETURN v_dias + 1;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
  `);

  // ---------------------------------------------------------------
  // Função: gera a escala real para um intervalo de datas, a partir do ciclo
  // ---------------------------------------------------------------
  await knex.raw(`
    CREATE OR REPLACE FUNCTION fn_v2_gerar_escala(p_data_inicio DATE, p_data_fim DATE)
    RETURNS VOID AS $$
    BEGIN
      INSERT INTO v2_escala (data, fk_id_turno, fk_id_grupamento, origem)
      SELECT d::date, ce.fk_id_turno, ce.fk_id_grupamento, 'CICLO'
      FROM generate_series(p_data_inicio, p_data_fim, interval '1 day') AS d
      JOIN v2_ciclo_escala ce ON ce.dia_ciclo = fn_v2_dia_ciclo(d::date)
      ON CONFLICT (data, fk_id_turno) DO NOTHING;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // ---------------------------------------------------------------
  // View: escala já com os usuários de cada grupamento (vínculo vigente)
  // Agora junta direto com "users" — v2_usuario não existe mais.
  // ---------------------------------------------------------------
  await knex.raw(`
    CREATE OR REPLACE VIEW vw_v2_escala_usuarios AS
    SELECT
      e.data,
      t.numero        AS turno,
      t.hora_inicio,
      t.hora_fim,
      g.sigla         AS grupamento,
      u.id_user       AS id_usuario,
      u.nome,
      u.nome_guerra,
      u.matricula,
      e.origem
    FROM v2_escala e
    JOIN v2_turno       t  ON t.id_turno = e.fk_id_turno
    JOIN v2_grupamento  g  ON g.id_grupamento = e.fk_id_grupamento
    JOIN v2_grupamento_usuario gu
         ON gu.fk_id_grupamento = e.fk_id_grupamento
        AND e.data BETWEEN gu.data_inicio AND COALESCE(gu.data_fim, 'infinity'::date)
    JOIN users u ON u.id_user = gu.fk_id_usuario
    WHERE u.is_active;
  `);
};

exports.down = async function (knex) {
  await knex.raw("DROP VIEW IF EXISTS vw_v2_escala_usuarios");
  await knex.raw("DROP FUNCTION IF EXISTS fn_v2_gerar_escala(date, date)");
  await knex.raw("DROP FUNCTION IF EXISTS fn_v2_dia_ciclo(date)");

  await knex.schema.dropTableIfExists("v2_escala");
  await knex.schema.dropTableIfExists("v2_ciclo_escala_config");
  await knex.schema.dropTableIfExists("v2_ciclo_escala");
  await knex.schema.dropTableIfExists("v2_grupamento_usuario");
  await knex.schema.dropTableIfExists("v2_grupamento");
  await knex.schema.dropTableIfExists("v2_turno");

  await knex.schema.dropTableIfExists("tbl_escala_admin_autorizados");
  await knex.schema.dropTableIfExists("tbl_guarnicao");
  await knex.schema.dropTableIfExists("efetivo_antiguidade");
  await knex.schema.dropTableIfExists("masters");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("tbl_escala");
  await knex.schema.dropTableIfExists("admins");
  await knex.schema.dropTableIfExists("tbl_patentes");
  await knex.schema.dropTableIfExists("tbl_setores");
};