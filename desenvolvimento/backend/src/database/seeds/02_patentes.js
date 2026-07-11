exports.seed = async function (knex) {
  await knex("tbl_patentes").del();

  const now = new Date().toISOString();

  await knex("tbl_patentes").insert([
    {
      id_patente: 1,
      nome_patente: "CORONEL",
      sigla_patente: "CEL",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 2,
      nome_patente: "TENENTE-CORONEL",
      sigla_patente: "TEN-CEL",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 3,
      nome_patente: "MAJOR",
      sigla_patente: "MAJ",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 4,
      nome_patente: "CAPITÃO",
      sigla_patente: "CAP",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 5,
      nome_patente: "1º TENENTE",
      sigla_patente: "1º TEN",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 6,
      nome_patente: "2º TENENTE",
      sigla_patente: "2º TEN",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 7,
      nome_patente:"ASPIRANTE OFICIAL",
      sigla_patente: "ASP-OF",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 8,
      nome_patente: "CADETE 4º ANO",
      sigla_patente: "CAD-4º",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 9,
      nome_patente: "CADETE 3º ANO",
      sigla_patente: "CAD-3º",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 10,
      nome_patente: "CADETE 2º ANO",
      sigla_patente: "CAD-2º",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 11,
      nome_patente: "CADETE 1º ANO",
      sigla_patente: "CAD-1º",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 12,
      nome_patente: "SUBTENENTE",
      sigla_patente: "ST",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 13,
      nome_patente: "1º SARGENTO",
      sigla_patente: "1º SGT",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 14,
      nome_patente: "2º SARGENTO",
      sigla_patente: "2º SGT",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 15,
      nome_patente: "3º SARGENTO",
      sigla_patente: "3º SGT",
      is_active: true,
      created_at: now,
      updated_at: now
    },  
    {
      id_patente: 16,
      nome_patente: "CABO",
      sigla_patente: "CAB",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 17,
      nome_patente: "SOLDADO",
      sigla_patente: "SD",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 18,
      nome_patente: "SOLDADO 1ª CLASSE",
      sigla_patente: "SD-1ª",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 19,
      nome_patente: "SOLDADO 2ª CLASSE",
      sigla_patente: "SD-2ª",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 20,
      nome_patente: "SOLDADO 3ª CLASSE",
      sigla_patente: "SD-3ª",
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id_patente: 21,
      nome_patente: "SOLDADO ALUNO",
      sigla_patente: "SD-AL",
      is_active: true,
      created_at: now,
      updated_at: now
    }
  ]);
}
