const bcrypt = require('bcryptjs');
exports.seed = async function(knex) {
  await knex('admins').del()
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123456', salt);
  await knex('admins').insert([
    {
      id_admin: 1, 
      email: 'marciosensei@gmail.com', 
      password: hashedPassword, 
      nome: 'Marcio Alves',
      cpf: '03251007483',
      matricula: '200207001890',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id_admin: 2, 
      email: 'johndoe@gmail.com', 
      password: hashedPassword, 
      nome: 'John Doe',
      cpf: '03251007482',
      matricula: '200207001891',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
};
