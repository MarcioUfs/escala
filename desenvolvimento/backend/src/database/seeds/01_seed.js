const bcryptjs = require("bcryptjs");
require('dotenv').config();

// Senha de TODOS os registros de seed (admins, users, masters) vem da
// variável de ambiente SEED_PASS — nunca fica hardcoded no arquivo.
// Defina antes de rodar o seed, ex: SEED_PASS=minhasenha123 npx knex seed:run
// Hash único gerado uma vez e reaproveitado — gerar hashes bcrypt
// individuais pra cada linha seria só custo de CPU à toa em dado de seed.

const NOMES = [
  "Marcos", "João", "Pedro", "Lucas", "Rafael", "Carlos", "Bruno", "Felipe",
  "Diego", "Thiago", "André", "Rodrigo", "Gustavo", "Leonardo", "Vinícius",
  "Eduardo", "Fernando", "Ricardo", "Alexandre", "Marcelo", "Daniel",
  "Fábio", "Renato", "Sérgio", "Wagner", "Anderson", "Fabrício", "Gabriel",
  "Henrique", "Igor", "Jorge", "Luiz", "Mateus", "Nelson", "Otávio",
];

const SOBRENOMES = [
  "Lima Santos", "Oliveira Souza", "Costa Ferreira", "Almeida Rocha",
  "Pereira Gomes", "Barbosa Nunes", "Cardoso Ribeiro", "Teixeira Dias",
  "Araújo Correia", "Machado Freitas", "Melo Cavalcante", "Moraes Pinto",
  "Vieira Castro", "Nascimento Reis", "Farias Monteiro", "Andrade Batista",
  "Carvalho Duarte", "Martins Xavier", "Azevedo Fonseca", "Ramos Guimarães",
  "Siqueira Lopes", "Tavares Brito", "Figueiredo Neves", "Bezerra Campos",
  "Coelho Vasconcelos", "Peixoto Aragão", "Sales Meireles", "Braga Junqueira",
  "Cunha Pimentel", "Rezende Salgado",
];

// Lista real (21 patentes) — copiada de 02_patentes.js
const PATENTES = [
  { id_patente: 1, nome_patente: "CORONEL", sigla_patente: "CEL" },
  { id_patente: 2, nome_patente: "TENENTE-CORONEL", sigla_patente: "TEN-CEL" },
  { id_patente: 3, nome_patente: "MAJOR", sigla_patente: "MAJ" },
  { id_patente: 4, nome_patente: "CAPITÃO", sigla_patente: "CAP" },
  { id_patente: 5, nome_patente: "1º TENENTE", sigla_patente: "1º TEN" },
  { id_patente: 6, nome_patente: "2º TENENTE", sigla_patente: "2º TEN" },
  { id_patente: 7, nome_patente: "ASPIRANTE OFICIAL", sigla_patente: "ASP-OF" },
  { id_patente: 8, nome_patente: "CADETE 4º ANO", sigla_patente: "CAD-4º" },
  { id_patente: 9, nome_patente: "CADETE 3º ANO", sigla_patente: "CAD-3º" },
  { id_patente: 10, nome_patente: "CADETE 2º ANO", sigla_patente: "CAD-2º" },
  { id_patente: 11, nome_patente: "CADETE 1º ANO", sigla_patente: "CAD-1º" },
  { id_patente: 12, nome_patente: "SUBTENENTE", sigla_patente: "ST" },
  { id_patente: 13, nome_patente: "1º SARGENTO", sigla_patente: "1º SGT" },
  { id_patente: 14, nome_patente: "2º SARGENTO", sigla_patente: "2º SGT" },
  { id_patente: 15, nome_patente: "3º SARGENTO", sigla_patente: "3º SGT" },
  { id_patente: 16, nome_patente: "CABO", sigla_patente: "CB" },
  { id_patente: 17, nome_patente: "SOLDADO", sigla_patente: "SD" },
  { id_patente: 18, nome_patente: "SOLDADO 1ª CLASSE", sigla_patente: "SD-1ª" },
  { id_patente: 19, nome_patente: "SOLDADO 2ª CLASSE", sigla_patente: "SD-2ª" },
  { id_patente: 20, nome_patente: "SOLDADO 3ª CLASSE", sigla_patente: "SD-3ª" },
  { id_patente: 21, nome_patente: "SOLDADO ALUNO", sigla_patente: "SD-AL" },
];

// Setores reais — copiados de 01_seed.js
const SETORES = [
  { id_setor: 5000, nome_setor: "Administração CIOSP", sigla: "SSP", is_active: false },
  { id_setor: 4000, nome_setor: "Gestão CIOSP", sigla: "SSP", is_active: false },
  { id_setor: 3000, nome_setor: "Administração COPOM", sigla: "BPGD", is_active: true },
  { id_setor: 2000, nome_setor: "Gestão COPOM", sigla: "BPGD", is_active: true },
];

exports.seed = async function (knex) {
  const seedPassword = process.env.SEED_PASS;
  if (!seedPassword) {
    throw new Error(
      "SEED_PASS não definida. Defina a variável de ambiente antes de rodar o seed, ex: SEED_PASS=minhasenha123 npx knex seed:run",
    );
  }
  const hashedPassword = await bcryptjs.hash(seedPassword, 10);
  const now = new Date().toISOString();

  // -----------------------------------------------------------------
  // Limpeza — ordem inversa de dependência
  // -----------------------------------------------------------------
  await knex("v2_grupamento_usuario").del();
  await knex("v2_escala").del();
  await knex("v2_ciclo_escala").del();
  await knex("v2_ciclo_escala_config").del();
  await knex("v2_grupamento").del();
  await knex("v2_turno").del();
  await knex("tbl_escala_admin_autorizados").del();
  await knex("tbl_guarnicao").del();
  await knex("tbl_escala").del();
  await knex("masters").del();
  await knex("users").del();
  await knex("admins").del();
  await knex("tbl_patentes").del();
  await knex("tbl_setores").del();

  // -----------------------------------------------------------------
  // tbl_setores (4, valores reais)
  // -----------------------------------------------------------------
  await knex("tbl_setores").insert(
    SETORES.map((s) => ({ ...s, created_at: now, updated_at: now })),
  );

  // -----------------------------------------------------------------
  // tbl_patentes (21, valores reais)
  // -----------------------------------------------------------------
  await knex("tbl_patentes").insert(
    PATENTES.map((p) => ({ ...p, is_active: true, created_at: now, updated_at: now })),
  );

  // -----------------------------------------------------------------
  // admins (3, valores reais — role de "John Doe" corrigida de "" para
  // "admin", senão ele não passaria no middleware isAdmin)
  // -----------------------------------------------------------------
  await knex("admins").insert([
    {
      id_admin: 100000,
      password: hashedPassword,
      nome: "Marcio Alves",
      cpf: "03251007483",
      role: "admin",
      fk_id_setor: 3000,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id_admin: 100001,
      password: hashedPassword,
      nome: "John Doe",
      cpf: "03251007482",
      role: "admin", // corrigido — estava "" no seed original
      fk_id_setor: 2000,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id_admin: 100002,
      password: hashedPassword,
      nome: "Myths Admin",
      cpf: "00000000001",
      role: "admin",
      fk_id_setor: 3000,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ]);
  await knex.raw(
    "SELECT setval('admins_id_admin_seq', (SELECT MAX(id_admin) FROM admins))",
  );

  // -----------------------------------------------------------------
  // tbl_escala (2, valores reais — módulo v1, ainda em uso pelo front)
  // -----------------------------------------------------------------
  await knex("tbl_escala").insert([
    {
      id_escala: 100000,
      nome_escala: "Ciosp 2026-02",
      descricao_escala:
        "Escala de serviço para o CIOSP com rotação de guarnições A-B-C-D-E-F e 3 dias de folga por semana.",
      data_inicio: "2026-02-01 07:00:00.000-03",
      data_fim: "2026-02-28 23:00:00.000-03",
      fk_id_setor: 3000,
      fk_id_admin: 100000,
      is_active: true,
      admins_autorizados: JSON.stringify({
        auth_admins: [
          { id_admin: 100001, created_at: now },
          { id_admin: 100002, created_at: now },
        ],
      }),
      created_at: now,
      updated_at: now,
    },
    {
      id_escala: 100001,
      nome_escala: "Copom 2026-06",
      descricao_escala:
        "Escala de serviço para o COPOM com rotação de guarnições A-B-C-D-E-F e 3 dias de folga por semana.",
      data_inicio: "2026-06-01 07:00:00.000-03",
      data_fim: "2026-06-30 23:00:00.000-03",
      fk_id_setor: 3000,
      fk_id_admin: 100001,
      is_active: true,
      admins_autorizados: JSON.stringify({
        auth_admins: [
          { id_admin: 100000, created_at: now },
          { id_admin: 100002, created_at: now },
        ],
      }),
      created_at: now,
      updated_at: now,
    },
  ]);

  // -----------------------------------------------------------------
  // users (100) — 2 identidades fixas vindas do seu 01_seed.js real
  // (Marcos Lima Santos e Jose Francisco, cujo CPF 635.426.174-15 é o
  // segundo CPF especial que você pediu antes — aqui como user, não
  // admin, seguindo o que está no seu arquivo real) + 98 aleatórios.
  // -----------------------------------------------------------------
  const usersFixos = [
    {
      id_user: 100000,
      email: "marcos@gmail.com",
      nome: "Marcos Lima Santos",
      id_patente: 13, // 1º SARGENTO
      cpf: "10101010101",
      matricula: "200205000890",
      telefone: "11987654321",
      nome_guerra: "Marcos Lima",
      is_active: true,
      role: "user",
    },
    {
      id_user: 100001,
      email: "josef@gmail.com",
      nome: "Jose Francisco de Assis",
      id_patente: 14, // 2º SARGENTO
      cpf: "63542617415",
      matricula: "200207001891",
      telefone: "11987654321",
      nome_guerra: "Jose Francisco",
      is_active: true,
      role: "user",
    },
  ];

  const usersAleatorios = [];
  for (let i = 0; i < 98; i++) {
    const nome = NOMES[i % NOMES.length];
    const sobrenome = SOBRENOMES[Math.floor(i / NOMES.length) % SOBRENOMES.length];
    const nomeCompleto = `${nome} ${sobrenome}`;
    const idPatente = PATENTES[i % PATENTES.length].id_patente;

    usersAleatorios.push({
      id_user: 100100 + i,
      email: `${nome.toLowerCase()}.${sobrenome.split(" ")[0].toLowerCase()}${i}@escalapmse.local`,
      nome: nomeCompleto,
      id_patente: idPatente,
      cpf: String(20000000000 + i).padStart(11, "0"),
      matricula: `2002${String(i + 1).padStart(8, "0")}`,
      telefone: `1198${String(1000000 + i).padStart(7, "0")}`,
      nome_guerra: nome,
      is_active: true,
      role: "user",
    });
  }

  const todosUsers = [...usersFixos, ...usersAleatorios].map((u) => ({
    ...u,
    password: hashedPassword,
    created_at: now,
    updated_at: now,
  }));

  await knex("users").insert(todosUsers);
  await knex.raw(
    "SELECT setval('users_id_user_seq', (SELECT MAX(id_user) FROM users))",
  );

  // -----------------------------------------------------------------
  // masters (2, valores reais)
  // -----------------------------------------------------------------
  await knex("masters").insert([
    {
      id_master: 100,
      password: hashedPassword,
      nome: "Myths Master",
      cpf: "00000000001",
      role: "master",
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id_master: 101,
      password: hashedPassword,
      nome: "Another Master",
      cpf: "00000000002",
      role: "master",
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ]);

  // -----------------------------------------------------------------
  // tbl_guarnicao (1, valor real de exemplo — módulo v1)
  // -----------------------------------------------------------------
  await knex("tbl_guarnicao").insert([
    {
      id_guarnicao: 1000,
      data_guarnicao: "2026-02-01 07:00:00.000-03",
      hora_guarnicao: "2026-02-01 07:00:00.000-03",
      turno: 1,
      dayofyear: 32,
      grupamento: "A",
      fk_id_escala: 100000,
      dados_guarnicao: JSON.stringify({
        grupamento_escala: [
          {
            id_user: 100000,
            funcao: "CMD",
            graduacao: "1º SGT",
            matricula: "200205000890",
            nome_guerra: "Marcos Lima",
            cpf: "10101010101",
            nome: "Marcos Lima Santos",
          },
          {
            id_user: 100001,
            funcao: "CMD",
            graduacao: "2º SGT",
            matricula: "200207001891",
            nome_guerra: "Jose Francisco",
            cpf: "63542617415",
            nome: "Jose Francisco de Assis",
          },
        ],
      }),
    },
  ]);

  // -----------------------------------------------------------------
  // tbl_escala_admin_autorizados (2, valores reais)
  // -----------------------------------------------------------------
  await knex("tbl_escala_admin_autorizados").insert([
    { id_escala_admin_autorizado: 50, fk_id_escala: 100000, fk_id_admin: 100001 },
    { id_escala_admin_autorizado: 51, fk_id_escala: 100000, fk_id_admin: 100002 },
  ]);

  // -----------------------------------------------------------------
  // v2_turno (3)
  // -----------------------------------------------------------------
  await knex("v2_turno").insert([
    { id_turno: 1, numero: 1, descricao: "1º Turno (07h-15h)", hora_inicio: "07:00", hora_fim: "15:00", created_at: now, updated_at: now },
    { id_turno: 2, numero: 2, descricao: "2º Turno (15h-23h)", hora_inicio: "15:00", hora_fim: "23:00", created_at: now, updated_at: now },
    { id_turno: 3, numero: 3, descricao: "3º Turno (23h-07h)", hora_inicio: "23:00", hora_fim: "07:00", created_at: now, updated_at: now },
  ]);

  // -----------------------------------------------------------------
  // v2_grupamento (6, A-F)
  // -----------------------------------------------------------------
  await knex("v2_grupamento").insert([
    { id_grupamento: 1, sigla: "A", nome: "Grupamento A", created_at: now, updated_at: now },
    { id_grupamento: 2, sigla: "B", nome: "Grupamento B", created_at: now, updated_at: now },
    { id_grupamento: 3, sigla: "C", nome: "Grupamento C", created_at: now, updated_at: now },
    { id_grupamento: 4, sigla: "D", nome: "Grupamento D", created_at: now, updated_at: now },
    { id_grupamento: 5, sigla: "E", nome: "Grupamento E", created_at: now, updated_at: now },
    { id_grupamento: 6, sigla: "F", nome: "Grupamento F", created_at: now, updated_at: now },
  ]);

  // -----------------------------------------------------------------
  // v2_grupamento_usuario — vínculo direto com "users" (v2_usuario não
  // existe mais). 1 pessoa por grupamento como exemplo: os 2 usuários
  // fixos (A, B) + 4 dos aleatórios (C, D, E, F).
  // -----------------------------------------------------------------
  await knex("v2_grupamento_usuario").insert([
    { fk_id_usuario: 100000, fk_id_grupamento: 1, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // A
    { fk_id_usuario: 100001, fk_id_grupamento: 2, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // B
    { fk_id_usuario: 100100, fk_id_grupamento: 3, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // C
    { fk_id_usuario: 100101, fk_id_grupamento: 4, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // D
    { fk_id_usuario: 100102, fk_id_grupamento: 5, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // E
    { fk_id_usuario: 100103, fk_id_grupamento: 6, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // F
  ]);

  // -----------------------------------------------------------------
  // v2_ciclo_escala (18 linhas) — versão CORRIGIDA confirmada contra a
  // "ESCALA DESPACHANTE COPOM" real: dia1 A-F-E, dia2 B-A-F, dia3 C-B-A,
  // dia4 D-C-B, dia5 E-D-C, dia6 F-E-D.
  // -----------------------------------------------------------------
  await knex("v2_ciclo_escala").insert([
    { dia_ciclo: 1, fk_id_turno: 1, fk_id_grupamento: 1, created_at: now, updated_at: now }, // A
    { dia_ciclo: 1, fk_id_turno: 2, fk_id_grupamento: 6, created_at: now, updated_at: now }, // F
    { dia_ciclo: 1, fk_id_turno: 3, fk_id_grupamento: 5, created_at: now, updated_at: now }, // E
    { dia_ciclo: 2, fk_id_turno: 1, fk_id_grupamento: 2, created_at: now, updated_at: now }, // B
    { dia_ciclo: 2, fk_id_turno: 2, fk_id_grupamento: 1, created_at: now, updated_at: now }, // A
    { dia_ciclo: 2, fk_id_turno: 3, fk_id_grupamento: 6, created_at: now, updated_at: now }, // F
    { dia_ciclo: 3, fk_id_turno: 1, fk_id_grupamento: 3, created_at: now, updated_at: now }, // C
    { dia_ciclo: 3, fk_id_turno: 2, fk_id_grupamento: 2, created_at: now, updated_at: now }, // B
    { dia_ciclo: 3, fk_id_turno: 3, fk_id_grupamento: 1, created_at: now, updated_at: now }, // A
    { dia_ciclo: 4, fk_id_turno: 1, fk_id_grupamento: 4, created_at: now, updated_at: now }, // D
    { dia_ciclo: 4, fk_id_turno: 2, fk_id_grupamento: 3, created_at: now, updated_at: now }, // C
    { dia_ciclo: 4, fk_id_turno: 3, fk_id_grupamento: 2, created_at: now, updated_at: now }, // B
    { dia_ciclo: 5, fk_id_turno: 1, fk_id_grupamento: 5, created_at: now, updated_at: now }, // E
    { dia_ciclo: 5, fk_id_turno: 2, fk_id_grupamento: 4, created_at: now, updated_at: now }, // D
    { dia_ciclo: 5, fk_id_turno: 3, fk_id_grupamento: 3, created_at: now, updated_at: now }, // C
    { dia_ciclo: 6, fk_id_turno: 1, fk_id_grupamento: 6, created_at: now, updated_at: now }, // F
    { dia_ciclo: 6, fk_id_turno: 2, fk_id_grupamento: 5, created_at: now, updated_at: now }, // E
    { dia_ciclo: 6, fk_id_turno: 3, fk_id_grupamento: 4, created_at: now, updated_at: now }, // D
  ]);

  // -----------------------------------------------------------------
  // v2_ciclo_escala_config — 01/07/2026 é o dia 1 do ciclo, confirmado
  // contra a escala real em conversas anteriores.
  // -----------------------------------------------------------------
  await knex("v2_ciclo_escala_config").insert([
    { id_config: 1, data_referencia: "2026-07-01", created_at: now, updated_at: now },
  ]);

  // -----------------------------------------------------------------
  // v2_escala — gera julho/2026 automaticamente a partir do ciclo
  // -----------------------------------------------------------------
  await knex.raw("SELECT fn_v2_gerar_escala(?, ?)", ["2026-07-01", "2026-07-31"]);
};