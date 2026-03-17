const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // 1. Limpar as tabelas na ordem correta (filha primeiro, depois pai)
  // Isso evita o erro de restrição de chave estrangeira (Foreign Key Constraint)
  await knex('dados_militares').del();
  await knex('users').del();

  // Gera o hash da senha '123456' uma única vez para usar em todos os usuários teste
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123456', salt);

  const now = new Date().toISOString();

  // 2. Inserir os Usuários (Tabela Pai)
  await knex('users').insert([
    {
      id_user: 1, 
      email: 'marciosensei@gmail.com', 
      password: hashedPassword, 
      nome: 'Marcio da Silva Alves',
      cpf: '03251007483',
      matricula: '200207001890',
      role: 'user',
      created_at: now,
      updated_at: now
    },
    {
      id_user: 2, 
      email: 'johndoe@gmail.com', 
      password: hashedPassword, 
      nome: 'John Doe',
      cpf: '03251007482',
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

  // 3. Inserir os Dados Militares (Tabela Filha)
  // O user_id aqui conecta diretamente com os id_user criados acima
  await knex('dados_militares').insert([
    {
      id_dados_militares: 1,
      user_id: 1,
      posto_graduacao: 'Terceiro Sargento',
      abreviacao: '3º SGT',
      peso_hierarquico: 10,
      anos_servico: 10,
      meses_servico: 5,
      dias_servico: 12,
      created_at: now,
      updated_at: now
    },
    {
      id_dados_militares: 2,
      user_id: 2,
      posto_graduacao: 'Capitão',
      abreviacao: 'CAP',
      peso_hierarquico: 4,
      anos_servico: 15,
      meses_servico: 2,
      dias_servico: 0,
      created_at: now,
      updated_at: now
    },
    {
      id_dados_militares: 3,
      user_id: 3,
      posto_graduacao: 'Soldado',
      abreviacao: 'SD',
      peso_hierarquico: 12,
      anos_servico: 2,
      meses_servico: 8,
      dias_servico: 15,
      created_at: now,
      updated_at: now
    },
    {
      id_dados_militares: 4,
      user_id: 4,
      posto_graduacao: 'Cabo',
      abreviacao: 'CB',
      peso_hierarquico: 11,
      anos_servico: 8,
      meses_servico: 11,
      dias_servico: 3,
      created_at: now,
      updated_at: now
    },
    {
      id_dados_militares: 5,
      user_id: 5,
      posto_graduacao: 'Primeiro Sargento',
      abreviacao: '1º SGT',
      peso_hierarquico: 8,
      anos_servico: 20,
      meses_servico: 1,
      dias_servico: 25,
      created_at: now,
      updated_at: now
    },
    {
      id_dados_militares: 6,
      user_id: 6,
      posto_graduacao: 'Segundo Tenente',
      abreviacao: '2º TEN',
      peso_hierarquico: 6,
      anos_servico: 12,
      meses_servico: 4,
      dias_servico: 10,
      created_at: now,
      updated_at: now
    },
    {
      id_dados_militares: 7,
      user_id: 7,
      posto_graduacao: 'Subtenente',
      abreviacao: 'ST',
      peso_hierarquico: 7,
      anos_servico: 25,
      meses_servico: 0,
      dias_servico: 5,
      created_at: now,
      updated_at: now
    },
    {
      id_dados_militares: 8,
      user_id: 8,
      posto_graduacao: 'Major',
      abreviacao: 'MAJ',
      peso_hierarquico: 3,
      anos_servico: 18,
      meses_servico: 7,
      dias_servico: 20,
      created_at: now,
      updated_at: now
    },
    {
      id_dados_militares: 9,
      user_id: 9,
      posto_graduacao: 'Soldado',
      abreviacao: 'SD',
      peso_hierarquico: 12,
      anos_servico: 1,
      meses_servico: 3,
      dias_servico: 2,
      created_at: now,
      updated_at: now
    },
    {
      id_dados_militares: 10,
      user_id: 10,
      posto_graduacao: 'Terceiro Sargento',
      abreviacao: '3º SGT',
      peso_hierarquico: 10,
      anos_servico: 11,
      meses_servico: 9,
      dias_servico: 14,
      created_at: now,
      updated_at: now
    }
  ]);
};