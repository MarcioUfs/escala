exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.integer('id_patente').unsigned().after('nome');
    table.foreign('id_patente')
         .references('id_patente') // Coluna na tabela de destino
         .inTable('tbl_patentes')  // Tabela de destino
         .onDelete('SET NULL')     // Se a patente for apagada, o campo no user vira null (opcional, mas recomendado)
         .onUpdate('CASCADE');     // Se o ID da patente mudar, atualiza aqui também
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropForeign('id_patente');
    table.dropColumn('id_patente');
  });
};