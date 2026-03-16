exports.up = async function (knex) {
  await knex.schema.createTable("almanaque_pmse", (table) => {
    table.increments("id_almanaque").primary();
    
    // A ordem numérica (ex: 9º vira 9) para facilitar a ordenação no frontend
    table.integer("ordem").notNullable();
    
    table.string("patente", 20).notNullable();
    table.string("quadro", 50).notNullable();
    
    // Matrícula DEVE ser única para que o banco saiba quem atualizar nas raspagens futuras
    table.string("matricula", 50).notNullable().unique();
    
    table.string("nome", 255).notNullable();
    
    // Coluna tipo Date para podermos fazer cálculos de tempo depois, se necessário
    table.date("data_promocao").notNullable();
    
    // O texto literal "2 anos 10 meses e 25 dias"
    table.string("tempo_promocao", 255).notNullable();
    
    // Para sabermos exatamente quando o script de raspagem rodou e inseriu/atualizou o dado
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("almanaque_pmse");
};