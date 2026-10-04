// O1 da auditoria: o cron do scraper de antiguidade só registrava
// sucesso/falha em console.log/console.error -- nenhum lugar persistente
// pra consultar depois ("sem alerta" e "sem persistência de última
// execução" eram a mesma causa: nada sobrevivia a um restart do processo).
exports.up = function (knex) {
  return knex.schema.createTable("scraper_execucoes", function (table) {
    table.increments("id").primary();
    // Hoje só existe o scraper de antiguidade, mas a coluna já identifica
    // qual rotina gerou o registro, caso outro cron seja adicionado depois.
    table.string("rotina").notNullable().defaultTo("antiguidade");
    table.enu("status", ["sucesso", "falha"]).notNullable();
    table.integer("tentativas").notNullable();
    table.timestamp("iniciado_em").notNullable();
    table.timestamp("finalizado_em").notNullable();
    // Só a última linha de log (sem stack trace completo, sem dado de
    // credencial) -- o suficiente pra saber o motivo sem virar um
    // despejo de informação sensível numa tabela consultável pela API.
    table.text("detalhe").nullable();
    table.index(["rotina", "iniciado_em"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("scraper_execucoes");
};
