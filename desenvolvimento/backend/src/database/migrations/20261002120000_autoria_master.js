// Perfil MASTER: pode executar as mesmas ações do administrador, então as
// tabelas que registram "quem fez" precisam conseguir apontar para ele.
//
// Os masters vivem em tabela própria (masters.id_master), não em admins —
// por isso uma coluna nova ao lado de cada fk_id_admin, em vez de reaproveitar
// a existente: a FK atual aponta para admins.id_admin e um id_master não teria
// significado ali (apontaria para outro administrador, ou para ninguém).
//
// Em cada registro, no máximo UMA das duas colunas vem preenchida: ação de
// admin preenche fk_id_admin, ação de master preenche fk_id_master.
//
// Só entram aqui as 4 tabelas em que o código realmente grava autoria.
// tbl_escala e tbl_escala_admin_autorizados também têm fk_id_admin, mas são
// legadas (substituídas pelo módulo v2) e nenhum código ativo escreve nelas —
// adicionar coluna lá seria schema morto.

const COLUNAS = [
  { tabela: "avisos", coluna: "fk_id_master" },
  { tabela: "v2_afastamentos", coluna: "fk_id_master" },
  { tabela: "v2_afastamentos", coluna: "fk_id_master_encerramento" },
  { tabela: "v2_escala_substituicao", coluna: "fk_id_master" },
  { tabela: "v2_permuta_solicitacao", coluna: "fk_id_master_analise" },
];

exports.up = async function (knex) {
  for (const { tabela, coluna } of COLUNAS) {
    await knex.schema.alterTable(tabela, function (table) {
      table
        .integer(coluna)
        .unsigned()
        .nullable()
        .references("id_master")
        .inTable("masters")
        .onDelete("SET NULL");
    });
  }
};

exports.down = async function (knex) {
  for (const { tabela, coluna } of [...COLUNAS].reverse()) {
    await knex.schema.alterTable(tabela, function (table) {
      table.dropColumn(coluna);
    });
  }
};
