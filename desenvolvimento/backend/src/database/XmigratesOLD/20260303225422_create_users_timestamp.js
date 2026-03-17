exports.up = function(knex) {
  return knex.schema
    .dropTableIfExists('users')
    .createTable('users', function(table) {
      table.increments('id_user').primary();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.string('cpf').notNullable().unique();
      table.string('nome').notNullable();
      table.boolean('admin').notNullable();
      table.string('role').notNullable();
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};