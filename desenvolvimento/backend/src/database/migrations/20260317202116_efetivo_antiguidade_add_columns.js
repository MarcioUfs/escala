exports.up = function (knex) {
  knex.schema.dropTableIfExists("efetivo_antiguidade");
  return knex.schema.createTable("efetivo_antiguidade", (table) => {
    table.increments("id").primary();

    // A matrícula é o identificador ideal para evitar policiais duplicados
    table.string("matricula").notNullable().unique();
    table.string("antiguidade").notNullable();
    table.integer("ordem").notNullable().unique();
    table.string("patente").notNullable();
    table.string("quadro").notNullable();
    table.string("nome").notNullable();
    table.string("data_promocao").notNullable();
    table.string("tempo_promocao").notNullable();


    // Salva a data exata em que o scraper atualizou esse registro
    table.timestamp("atualizado_em").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("efetivo_antiguidade");
};