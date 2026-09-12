// Motivos de restrição geral — extraídos do boletim real do COPOM/PMSE
// usado como referência (RESTRIÇÕES GERAIS: serviços externos, TFM, ordem
// unida, ortostase prolongada, uso de coturno, sobrecarga de peso,
// barbear-se periodicamente). É só a carga inicial — o admin pode
// adicionar novos motivos pela própria tela, sem precisar de migration.
exports.seed = async function (knex) {
  const motivos = [
    "Serviços externos",
    "TFM",
    "Ordem unida",
    "Ortostase prolongada",
    "Uso de coturno",
    "Sobrecarga de peso",
    "Barbear-se periodicamente",
  ];

  for (const descricao of motivos) {
    const existente = await knex("v2_motivo_restricao").where({ descricao }).first();
    if (!existente) {
      await knex("v2_motivo_restricao").insert({ descricao, is_active: true });
    }
  }
};
