exports.up = function(knex) {
   return knex.schema
    .dropTableIfExists('admins')
    .createTable('admins', function(table) {
      table.increments('id_admin').primary();
      table.string('email', 255).notNullable().unique();
      table.string('password', 255).notNullable();
      table.string('cpf', 14).notNullable().unique();
      table.string('nome', 255).notNullable();
      table.string('matricula', 255).notNullable().unique();
      table.string('role', 255).notNullable();
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('admins');
};
