// Seed das tabelas v2_* (projeto de escala/grupamentos).
// Não mexe nos dados de tbl_setores, admins, tbl_escala, users, masters,
// efetivo_antiguidade, tbl_guarnicao, tbl_escala_admin_autorizados ou tbl_patentes.
// Pressupõe que 01_seed.js e 02_patentes.js já rodaram (usa fk_id_user -> users
// e fk_id_patente -> tbl_patentes).

exports.seed = async function (knex) {
  // Limpeza na ordem inversa das dependências (filhos antes dos pais)
  await knex("v2_escala").del();
  await knex("v2_ciclo_escala_config").del();
  await knex("v2_ciclo_escala").del();
  await knex("v2_grupamento_usuario").del();
  await knex("v2_usuario").del();
  await knex("v2_grupamento").del();
  await knex("v2_turno").del();

  const now = new Date().toISOString();

  // -----------------------------------------------------------------
  // v2_turno
  // -----------------------------------------------------------------
  await knex("v2_turno").insert([
    { id_turno: 1, numero: 1, descricao: "1º Turno (07h-15h)", hora_inicio: "07:00", hora_fim: "15:00", created_at: now, updated_at: now },
    { id_turno: 2, numero: 2, descricao: "2º Turno (15h-23h)", hora_inicio: "15:00", hora_fim: "23:00", created_at: now, updated_at: now },
    { id_turno: 3, numero: 3, descricao: "3º Turno (23h-07h)", hora_inicio: "23:00", hora_fim: "07:00", created_at: now, updated_at: now },
  ]);

  // -----------------------------------------------------------------
  // v2_grupamento
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
  // v2_ciclo_escala (18 linhas: dia1 A-B-C, dia2 D-A-B, dia3 E-D-A,
  // dia4 F-E-D, dia5 C-F-E, dia6 B-C-F)
  // -----------------------------------------------------------------
  await knex("v2_ciclo_escala").insert([
    { dia_ciclo: 1, fk_id_turno: 1, fk_id_grupamento: 1, created_at: now, updated_at: now }, // A
    { dia_ciclo: 1, fk_id_turno: 2, fk_id_grupamento: 2, created_at: now, updated_at: now }, // B
    { dia_ciclo: 1, fk_id_turno: 3, fk_id_grupamento: 3, created_at: now, updated_at: now }, // C
    { dia_ciclo: 2, fk_id_turno: 1, fk_id_grupamento: 4, created_at: now, updated_at: now }, // D
    { dia_ciclo: 2, fk_id_turno: 2, fk_id_grupamento: 1, created_at: now, updated_at: now }, // A
    { dia_ciclo: 2, fk_id_turno: 3, fk_id_grupamento: 2, created_at: now, updated_at: now }, // B
    { dia_ciclo: 3, fk_id_turno: 1, fk_id_grupamento: 5, created_at: now, updated_at: now }, // E
    { dia_ciclo: 3, fk_id_turno: 2, fk_id_grupamento: 4, created_at: now, updated_at: now }, // D
    { dia_ciclo: 3, fk_id_turno: 3, fk_id_grupamento: 1, created_at: now, updated_at: now }, // A
    { dia_ciclo: 4, fk_id_turno: 1, fk_id_grupamento: 6, created_at: now, updated_at: now }, // F
    { dia_ciclo: 4, fk_id_turno: 2, fk_id_grupamento: 5, created_at: now, updated_at: now }, // E
    { dia_ciclo: 4, fk_id_turno: 3, fk_id_grupamento: 4, created_at: now, updated_at: now }, // D
    { dia_ciclo: 5, fk_id_turno: 1, fk_id_grupamento: 3, created_at: now, updated_at: now }, // C
    { dia_ciclo: 5, fk_id_turno: 2, fk_id_grupamento: 6, created_at: now, updated_at: now }, // F
    { dia_ciclo: 5, fk_id_turno: 3, fk_id_grupamento: 5, created_at: now, updated_at: now }, // E
    { dia_ciclo: 6, fk_id_turno: 1, fk_id_grupamento: 2, created_at: now, updated_at: now }, // B
    { dia_ciclo: 6, fk_id_turno: 2, fk_id_grupamento: 3, created_at: now, updated_at: now }, // C
    { dia_ciclo: 6, fk_id_turno: 3, fk_id_grupamento: 6, created_at: now, updated_at: now }, // F
  ]);

  // -----------------------------------------------------------------
  // v2_ciclo_escala_config
  // ATENÇÃO: ajuste "data_referencia" para a data real em que o dia 1
  // do ciclo (A no 1º, B no 2º, C no 3º) de fato ocorre.
  // Usei 2026-02-01 aqui só para casar com a "Ciosp 2026-02" já seedada.
  // -----------------------------------------------------------------
  await knex("v2_ciclo_escala_config").insert([
    { id_config: 1, data_referencia: "2026-02-01", created_at: now, updated_at: now },
  ]);

  // -----------------------------------------------------------------
  // v2_usuario
  // fk_id_user  -> mesma pessoa na tabela "users" já existente
  // fk_id_patente -> patente na "tbl_patentes" já existente
  // -----------------------------------------------------------------
  await knex("v2_usuario").insert([
    { id_usuario: 1, nome: "Marcos Lima Santos",        nome_guerra: "Marcos Lima", matricula: "200205000890", cpf: "10101010101", telefone: "11987654321", fk_id_patente: 13, fk_id_user: 100000, created_at: now, updated_at: now },
    { id_usuario: 2, nome: "Jose Francisco de Assis",   nome_guerra: "Marcos Lima", matricula: "200207001891", cpf: "63542617415", telefone: "11987654321", fk_id_patente: 14, fk_id_user: 100001, created_at: now, updated_at: now },
    { id_usuario: 3, nome: "Carlos Eduardo Silva",      nome_guerra: "Marcos Lima", matricula: "201507001234", cpf: "11122233344", telefone: null,           fk_id_patente: 16, fk_id_user: 100003, created_at: now, updated_at: now },
    { id_usuario: 4, nome: "Ana Beatriz Oliveira",      nome_guerra: "Marcos Lima", matricula: "201007005678", cpf: "55566677788", telefone: "79987654321", fk_id_patente: 17, fk_id_user: 100004, created_at: now, updated_at: now },
    { id_usuario: 5, nome: "Paulo Roberto Santos",      nome_guerra: "Marcos Lima", matricula: "199807009012", cpf: "99988877766", telefone: "11987654321", fk_id_patente: 12, fk_id_user: 100005, created_at: now, updated_at: now },
    { id_usuario: 6, nome: "Marcos Vinícius Souza",     nome_guerra: "Marcos Lima", matricula: "200507003456", cpf: "44433322211", telefone: "11987654321", fk_id_patente: 15, fk_id_user: 100006, created_at: now, updated_at: now },
  ]);

  // -----------------------------------------------------------------
  // v2_grupamento_usuario (1 usuário de exemplo por grupamento, vínculo vigente
  // desde 2026-01-01; em produção cada grupamento teria ~10 pessoas)
  // -----------------------------------------------------------------
  await knex("v2_grupamento_usuario").insert([
    { fk_id_usuario: 1, fk_id_grupamento: 1, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // A
    { fk_id_usuario: 2, fk_id_grupamento: 2, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // B
    { fk_id_usuario: 3, fk_id_grupamento: 3, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // C
    { fk_id_usuario: 4, fk_id_grupamento: 4, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // D
    { fk_id_usuario: 5, fk_id_grupamento: 5, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // E
    { fk_id_usuario: 6, fk_id_grupamento: 6, data_inicio: "2026-01-01", created_at: now, updated_at: now }, // F
  ]);

  // -----------------------------------------------------------------
  // v2_escala: gera fevereiro/2026 automaticamente a partir do ciclo,
  // usando a função criada na migration (fn_v2_gerar_escala)
  // -----------------------------------------------------------------
  await knex.raw("SELECT fn_v2_gerar_escala(?, ?)", ["2026-02-01", "2026-02-28"]);
};
