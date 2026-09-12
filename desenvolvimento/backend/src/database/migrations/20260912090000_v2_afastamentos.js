// Módulo de afastamentos e restrições — modela as seções do boletim mensal
// de justificativa do cartão-alimentação (férias, licença especial, cursos,
// restrições gerais/noturnas, escala diferenciada, redução de carga
// horária, afastamento) e serve de base pro "Resumo do efetivo" e pro
// boletim gerado pelo sistema.
//
// Decisões de modelagem (ver análise anterior, confirmada com o documento
// real do COPOM/PMSE):
//  - fk_id_usuario (não fk_id_militar) -> users.id_user, mesmo padrão de
//    v2_grupamento_usuario/v2_escala_substituicao/v2_permuta_solicitacao.
//  - "tipo" é CHECK fixo (mesmo padrão de v2_escala.origem), não tabela de
//    lookup — são categorias fixas do boletim oficial.
//  - turno_restrito e equipes_restritas viram tabelas de junção
//    (v2_afastamento_turno / v2_afastamento_grupamento) em vez de coluna
//    única ou array solto — o documento real mostra casos de restrição a
//    MAIS de um turno ao mesmo tempo ("SOMENTE 2º E 3º TURNO"), e junção
//    com FK evita valor inválido (turno/grupamento inexistente).
//  - modo_restricao (SOMENTE|EXCETO) + a lista de turnos cobre qualquer
//    permutação (só 1º, só 2º, só 3º, 1º e 2º, 2º e 3º, etc.) sem precisar
//    de uma combinação de CHECK constraints pra cada caso.
//  - v2_motivo_restricao é a ÚNICA tabela de lookup extensível do módulo —
//    é exatamente o "select de múltipla escolha + adicionar novo texto"
//    pedido pra RESTRIÇÃO GERAL (serviços externos, TFM, ordem unida,
//    ortostase prolongada, uso de coturno etc.), que no documento real é
//    texto livre demais pra virar um CHECK fixo.
//  - Todo o módulo é informativo: nada aqui bloqueia a geração/edição da
//    escala ou a permuta — só alimenta avisos visuais (decisão de negócio
//    confirmada explicitamente).

exports.up = async function (knex) {
  await knex.schema.createTable("v2_afastamentos", function (table) {
    table.increments("id_afastamento").primary();
    table
      .integer("fk_id_usuario")
      .unsigned()
      .notNullable()
      .references("id_user")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("tipo", 30).notNullable();
    table.string("modo_restricao", 10); // SOMENTE | EXCETO | NULL (não se aplica)
    table.date("data_inicio").notNullable();
    table.date("data_fim"); // null = prazo indeterminado
    table.string("bgo_referencia", 30);
    table.text("observacao"); // ex: horário customizado ("até às 13h"), detalhes livres
    table.boolean("ativo").notNullable().defaultTo(true);
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
    ALTER TABLE v2_afastamentos
    ADD CONSTRAINT chk_v2_afastamento_tipo
    CHECK (tipo IN (
      'FERIAS','FERIAS_LEI_109','LICENCA_ESPECIAL','CURSO','RESTRICAO_GERAL',
      'RESTRICAO_NOTURNA','ESCALA_DIFERENCIADA','REDUCAO_CARGA','AFASTAMENTO'
    ))
  `);
  await knex.raw(`
    ALTER TABLE v2_afastamentos
    ADD CONSTRAINT chk_v2_afastamento_modo
    CHECK (modo_restricao IS NULL OR modo_restricao IN ('SOMENTE','EXCETO'))
  `);
  await knex.raw(`
    ALTER TABLE v2_afastamentos
    ADD CONSTRAINT chk_v2_afastamento_periodo
    CHECK (data_fim IS NULL OR data_fim >= data_inicio)
  `);

  // Mesmo militar não pode ter dois afastamentos do MESMO tipo com período
  // sobreposto (tipos diferentes coexistem — ex: restrição geral + restrição
  // noturna ao mesmo tempo é uma situação real do documento fonte). Só
  // considera linhas ativas — uma linha encerrada (ativo=false) não deve
  // travar um novo cadastro no lugar dela.
  await knex.raw(`
    ALTER TABLE v2_afastamentos
    ADD CONSTRAINT excl_v2_afastamento_periodo
    EXCLUDE USING gist (
      fk_id_usuario WITH =,
      tipo WITH =,
      daterange(data_inicio, COALESCE(data_fim, 'infinity'::date), '[]') WITH &&
    ) WHERE (ativo)
  `);

  await knex.schema.alterTable("v2_afastamentos", function (table) {
    table.index("fk_id_usuario", "idx_v2_afastamento_usuario");
    table.index("tipo", "idx_v2_afastamento_tipo");
    table.index("ativo", "idx_v2_afastamento_ativo");
  });

  // ---------------------------------------------------------------
  // Turnos restritos (junção — cobre qualquer combinação de turnos)
  // ---------------------------------------------------------------
  await knex.schema.createTable("v2_afastamento_turno", function (table) {
    table.increments("id").primary();
    table
      .integer("fk_id_afastamento")
      .unsigned()
      .notNullable()
      .references("id_afastamento")
      .inTable("v2_afastamentos")
      .onDelete("CASCADE");
    table
      .integer("fk_id_turno")
      .unsigned()
      .notNullable()
      .references("id_turno")
      .inTable("v2_turno")
      .onDelete("CASCADE");
    table.unique(["fk_id_afastamento", "fk_id_turno"]);
  });

  // ---------------------------------------------------------------
  // Grupamentos aos quais a restrição se aplica (vazio = todos)
  // ---------------------------------------------------------------
  await knex.schema.createTable("v2_afastamento_grupamento", function (table) {
    table.increments("id").primary();
    table
      .integer("fk_id_afastamento")
      .unsigned()
      .notNullable()
      .references("id_afastamento")
      .inTable("v2_afastamentos")
      .onDelete("CASCADE");
    table
      .integer("fk_id_grupamento")
      .unsigned()
      .notNullable()
      .references("id_grupamento")
      .inTable("v2_grupamento")
      .onDelete("CASCADE");
    table.unique(["fk_id_afastamento", "fk_id_grupamento"]);
  });

  // ---------------------------------------------------------------
  // Motivos de restrição — lookup EXTENSÍVEL (admin pode cadastrar um novo
  // motivo em texto livre pela tela, que passa a existir como opção
  // selecionável dali pra frente). Usado sobretudo por RESTRICAO_GERAL, mas
  // sem trava de tipo — outros tipos podem combinar motivos também (ex: uma
  // restrição noturna que também cita "TFM" e "ordem unida", como no
  // documento real).
  // ---------------------------------------------------------------
  await knex.schema.createTable("v2_motivo_restricao", function (table) {
    table.increments("id_motivo_restricao").primary();
    table.string("descricao", 120).notNullable().unique();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("v2_afastamento_motivo", function (table) {
    table.increments("id").primary();
    table
      .integer("fk_id_afastamento")
      .unsigned()
      .notNullable()
      .references("id_afastamento")
      .inTable("v2_afastamentos")
      .onDelete("CASCADE");
    table
      .integer("fk_id_motivo_restricao")
      .unsigned()
      .notNullable()
      .references("id_motivo_restricao")
      .inTable("v2_motivo_restricao")
      .onDelete("CASCADE");
    table.unique(["fk_id_afastamento", "fk_id_motivo_restricao"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("v2_afastamento_motivo");
  await knex.schema.dropTableIfExists("v2_motivo_restricao");
  await knex.schema.dropTableIfExists("v2_afastamento_grupamento");
  await knex.schema.dropTableIfExists("v2_afastamento_turno");
  await knex.schema.dropTableIfExists("v2_afastamentos");
};
