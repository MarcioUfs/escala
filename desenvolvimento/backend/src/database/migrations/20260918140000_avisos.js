// Mural de avisos do painel. Cada publicação é uma linha nova (nunca se
// edita/apaga uma existente), então a tabela é o histórico completo; o
// aviso vigente é sempre a linha mais recente. Publicar texto vazio é a
// forma de "retirar" o aviso do ar, e isso também fica no histórico.
//
// nome_admin guarda o nome no momento da publicação, para o histórico
// continuar legível mesmo se o administrador for renomeado ou removido
// (fk_id_admin vira NULL nesse caso).
exports.up = async function (knex) {
  await knex.schema.createTable("avisos", function (table) {
    table.increments("id_aviso").primary();
    table.text("texto").notNullable().defaultTo("");
    table
      .integer("fk_id_admin")
      .unsigned()
      .nullable()
      .references("id_admin")
      .inTable("admins")
      .onDelete("SET NULL");
    table.string("nome_admin", 255).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.index("created_at", "idx_avisos_created_at");
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("avisos");
};
