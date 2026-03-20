const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // 1. Limpar as tabelas na ordem correta (filha primeiro, depois pai)
  // Isso evita o erro de restrição de chave estrangeira (Foreign Key Constraint)
  await knex('admins').del()
  await knex('users').del();

  // Gera o hash da senha '123456' uma única vez para usar em todos os usuários teste
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123456', salt);

  const now = new Date().toISOString();

  await knex('users').insert([
    {
      id_user: 1, 
      email: 'marcos@gmail.com', 
      password: hashedPassword, 
      nome: 'Marcos Lima Santos',
      cpf: '010101010101',
      matricula: '200205000890',
      role: 'user',
      created_at: now,
      updated_at: now
    },
    {
      id_user: 2, 
      email: 'josef@gmail.com', 
      password: hashedPassword, 
      nome: 'Jose Francisco de Assis',
      cpf: '63542617415',
      matricula: '200207001891',
      role: 'user',
      created_at: now,
      updated_at: now
    },
    {
      id_user: 3, 
      email: 'carlos.silva@gmail.com', 
      password: hashedPassword, 
      nome: 'Carlos Eduardo Silva',
      cpf: '11122233344',
      matricula: '201507001234',
      role: 'user',
      created_at: now,
      updated_at: now
    },
    {
      id_user: 4, 
      email: 'ana.oliveira@gmail.com', 
      password: hashedPassword, 
      nome: 'Ana Beatriz Oliveira',
      cpf: '55566677788',
      matricula: '201007005678',
      role: 'user',
      created_at: now,
      updated_at: now
    },
    {
      id_user: 5, 
      email: 'paulo.santos@gmail.com', 
      password: hashedPassword, 
      nome: 'Paulo Roberto Santos',
      cpf: '99988877766',
      matricula: '199807009012',
      role: 'user',
      created_at: now,
      updated_at: now
    },
    {
      id_user: 6, 
      email: 'marcos.souza@gmail.com', 
      password: hashedPassword, 
      nome: 'Marcos Vinícius Souza',
      cpf: '44433322211',
      matricula: '200507003456',
      role: 'user',
      created_at: now,
      updated_at: now
    },
    {
      id_user: 7, 
      email: 'roberto.costa@gmail.com', 
      password: hashedPassword, 
      nome: 'Roberto Carlos Costa',
      cpf: '12312312312',
      matricula: '199507007890',
      role: 'user',
      created_at: now,
      updated_at: now
    },
    {
      id_user: 8, 
      email: 'felipe.gomes@gmail.com', 
      password: hashedPassword, 
      nome: 'Felipe Augusto Gomes',
      cpf: '32132132132',
      matricula: '200807001122',
      role: 'user',
      created_at: now,
      updated_at: now
    },
    {
      id_user: 9, 
      email: 'lucas.almeida@gmail.com', 
      password: hashedPassword, 
      nome: 'Lucas Almeida',
      cpf: '45645645645',
      matricula: '202007003344',
      role: 'user',
      created_at: now,
      updated_at: now
    },
    {
      id_user: 10, 
      email: 'juliana.mendes@gmail.com', 
      password: hashedPassword, 
      nome: 'Juliana Mendes',
      cpf: '78978978978',
      matricula: '201207005566',
      role: 'user',
      created_at: now,
      updated_at: now
    }
  ]);

  await knex('admins').insert([
    {
      id_admin: 1, 
      email: 'marciosensei@gmail.com', 
      password: hashedPassword, 
      nome: 'Marcio Alves',
      cpf: '03251007483',
      matricula: '200207001890',
      role: 'admin',
      created_at: now,
      updated_at: now
    },
    {
      id_admin: 2, 
      email: 'johndoe@gmail.com', 
      password: hashedPassword, 
      nome: 'John Doe',
      cpf: '03251007482',
      matricula: '200207001891',
      role: 'admin',
      created_at: now,
      updated_at: now
    }
  ]);
};