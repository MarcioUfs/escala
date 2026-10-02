// Quem executou a ação administrativa: admin ou master.
//
// As duas colunas existem lado a lado nas tabelas que registram autoria
// (ver migration 20261002120000_autoria_master). Em cada registro só uma
// vem preenchida — a outra fica nula.
//
// Sem isto, uma ação de master gravaria autoria nula, e justamente o perfil
// mais poderoso do sistema ficaria sem rastro.
function autoriaDaRequisicao(req) {
  return {
    fk_id_admin: req.user?.id_admin ?? null,
    fk_id_master: req.user?.id_master ?? null,
  };
}

// Mesma ideia, para as tabelas em que a coluna tem sufixo (ex.:
// fk_id_admin_encerramento / fk_id_master_encerramento).
function autoriaDaRequisicaoCom(req, sufixo) {
  return {
    [`fk_id_admin_${sufixo}`]: req.user?.id_admin ?? null,
    [`fk_id_master_${sufixo}`]: req.user?.id_master ?? null,
  };
}

module.exports = { autoriaDaRequisicao, autoriaDaRequisicaoCom };
