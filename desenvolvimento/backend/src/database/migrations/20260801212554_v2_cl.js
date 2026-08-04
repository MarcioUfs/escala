// Migration que ADICIONA as novas tabelas v2_* (projeto de escala/grupamentos).
// Nenhuma tabela existente (tbl_setores, admins, tbl_escala, users, masters,
// efetivo_antiguidade, tbl_guarnicao, tbl_escala_admin_autorizados, tbl_patentes)
// é alterada ou removida por esta migration.

exports.up = async function (knex) {
  // Extensão necessária para a exclusion constraint que impede um usuário
  // de pertencer a dois grupamentos com períodos sobrepostos.
  await knex.raw("CREATE EXTENSION IF NOT EXISTS btree_gist");

  await knex.schema.dropTableIfExists("v2_escala");
  await knex.schema.dropTableIfExists("v2_ciclo_escala_config");
  await knex.schema.dropTableIfExists("v2_ciclo_escala");
  await knex.schema.dropTableIfExists("v2_grupamento_usuario");
  await knex.schema.dropTableIfExists("v2_usuario");
  await knex.schema.dropTableIfExists("v2_grupamento");
  await knex.schema.dropTableIfExists("v2_turno");

  await knex.raw("DROP VIEW IF EXISTS vw_v2_escala_usuarios");
  await knex.raw("DROP FUNCTION IF EXISTS fn_v2_gerar_escala(date, date)");
  await knex.raw("DROP FUNCTION IF EXISTS fn_v2_dia_ciclo(date)");

  // -----------------------------------------------------------------
  // v2_turno
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // v2_grupamento
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // v2_usuario
  // Entidade própria de "pessoa" para o módulo de escala. Campos
  // adicionados em relação à versão original que te enviei:
  //   - nome_guerra, telefone (para bater com o padrão da tabela "users")
  //   - fk_id_patente -> reaproveita a "tbl_patentes" já existente (não duplica)
  //   - fk_id_user    -> ponte opcional com a "users" já existente, caso a
  //                      mesma pessoa também tenha login no sistema atual
  // -----------------------------------------------------------------
  await knex.schema.createTable("v2_usuario", function (table) {
    table.increments("id_usuario").primary();
    table.string("nome", 255).notNullable();
    table.string("nome_guerra", 255).notNullable();
    table.string("matricula", 255).notNullable().unique();
    table.string("cpf", 11).notNullable().unique();
    table.string("telefone", 255);
    table
      .integer("fk_id_patente")
      .unsigned()
      .nullable()
      .references("id_patente")
      .inTable("tbl_patentes")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");
    table
      .integer("fk_id_user")
      .unsigned()
      .nullable()
      .references("id_user")
      .inTable("users")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);
  });

  // -----------------------------------------------------------------
  // v2_grupamento_usuario (vínculo histórico usuário <-> grupamento)
  // -----------------------------------------------------------------
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
      .references("id_usuario")
      .inTable("v2_usuario")
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

  // -----------------------------------------------------------------
  // v2_ciclo_escala (regra fixa do ciclo de 6 dias - 18 linhas)
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // v2_ciclo_escala_config (âncora entre o ciclo e o calendário real)
  // -----------------------------------------------------------------
  await knex.schema.createTable("v2_ciclo_escala_config", function (table) {
    table.integer("id_config").primary().defaultTo(1);
    table.date("data_referencia").notNullable(); // data que corresponde ao dia_ciclo = 1
    table.timestamps(true, true);
  });
  await knex.raw(`
    ALTER TABLE v2_ciclo_escala_config
    ADD CONSTRAINT chk_v2_config_singleton CHECK (id_config = 1)
  `);

  // -----------------------------------------------------------------
  // v2_escala (instância real, por data, gerada a partir do ciclo)
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // Função: calcula o dia do ciclo (1-6) para qualquer data
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // Função: gera a escala real para um intervalo de datas, a partir do ciclo
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // View: escala já com os usuários de cada grupamento (vínculo vigente)
  // -----------------------------------------------------------------
  await knex.raw(`
    CREATE OR REPLACE VIEW vw_v2_escala_usuarios AS
    SELECT
      e.data,
      t.numero        AS turno,
      t.hora_inicio,
      t.hora_fim,
      g.sigla         AS grupamento,
      u.id_usuario,
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
    JOIN v2_usuario u ON u.id_usuario = gu.fk_id_usuario
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
  await knex.schema.dropTableIfExists("v2_usuario");
  await knex.schema.dropTableIfExists("v2_grupamento");
  await knex.schema.dropTableIfExists("v2_turno");
};
