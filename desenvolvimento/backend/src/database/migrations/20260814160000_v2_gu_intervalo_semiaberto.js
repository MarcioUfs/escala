// A constraint excl_v2_gu_periodo originalmente usava daterange(...,'[]'),
// ou seja, com os dois lados (data_inicio e data_fim) inclusivos. Isso
// impedia trocar/permutar um militar de grupamento "a partir de hoje":
// encerrar o vínculo antigo (data_fim = hoje) e abrir o novo (data_inicio
// = hoje) para o mesmo militar sempre colidia, porque os dois intervalos
// incluíam o dia de hoje ao mesmo tempo, e o Postgres rejeitava o INSERT
// com violação de exclusão (virava "Erro interno do servidor" pro
// frontend).
//
// Com '[)' (fim exclusivo), data_fim passa a significar "primeiro dia em
// que o vínculo já não vale mais". Encerrar hoje e abrir outro hoje deixa
// de colidir, e o militar nunca fica com vínculo simultâneo em dois
// grupamentos.

exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE v2_grupamento_usuario
    DROP CONSTRAINT excl_v2_gu_periodo
  `);

  await knex.raw(`
    ALTER TABLE v2_grupamento_usuario
    ADD CONSTRAINT excl_v2_gu_periodo
    EXCLUDE USING gist (
      fk_id_usuario WITH =,
      daterange(data_inicio, COALESCE(data_fim, 'infinity'::date), '[)') WITH &&
    )
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE v2_grupamento_usuario
    DROP CONSTRAINT excl_v2_gu_periodo
  `);

  await knex.raw(`
    ALTER TABLE v2_grupamento_usuario
    ADD CONSTRAINT excl_v2_gu_periodo
    EXCLUDE USING gist (
      fk_id_usuario WITH =,
      daterange(data_inicio, COALESCE(data_fim, 'infinity'::date), '[]') WITH &&
    )
  `);
};