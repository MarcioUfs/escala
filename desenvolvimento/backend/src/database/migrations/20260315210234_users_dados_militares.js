exports.up = async function (knex) {
  // ==========================================
  // 1. FASE DE DROP (Ordem Reversa)
  // Apaga a tabela dependente primeiro, depois a tabela principal.
  // ==========================================
  await knex.schema.dropTableIfExists("dados_militares");
  await knex.schema.dropTableIfExists("users");

  // ==========================================
  // 2. FASE DE CRIAÇÃO DA TABELA PRINCIPAL
  // ==========================================
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

  // ==========================================
  // 3. FASE DE CRIAÇÃO DA TABELA DEPENDENTE
  // A modelagem que estrutura a antiguidade.
  // ==========================================
  await knex.schema.createTable("dados_militares", (table) => {
    table.increments("id_dados_militares").primary();

    // Relacionamento 1:1 com a tabela users
    // O 'onDelete("CASCADE")' garante que a exclusão do usuário exclua a ficha militar junto.
    table.integer("user_id").unsigned().notNullable().unique();
    table.foreign("user_id").references("id_user").inTable("users").onDelete("CASCADE");

    // Posto/Graduação e Abreviação
    table.string("posto_graduacao").notNullable();
    table.string("abreviacao", 10).notNullable();

    // O Segredo da Ordenação: Peso Hierárquico (Menor número = Maior Patente/Graduação)
    // CEL=1, TC=2, MAJ=3, CAP=4, 1ºTEN=5, 2ºTEN=6, ST=7, 1ºSGT=8, 2ºSGT=9, 3ºSGT=10, CB=11, SD=12
    table.integer("peso_hierarquico").notNullable();

    // Antiguidade dividida em números para cálculos precisos do sistema de escalas
    table.integer("anos_servico").notNullable().defaultTo(0);
    table.integer("meses_servico").notNullable().defaultTo(0);
    table.integer("dias_servico").notNullable().defaultTo(0);

    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  // No rollback, a ordem de destruição também começa pela tabela filha.
  await knex.schema.dropTableIfExists("dados_militares");
  await knex.schema.dropTableIfExists("users");
};