const database = require("../database/db");

// -----------------------------------------------------------------------
// Monta a grade NOMINAL (patente + matrícula + nome de cada militar) por
// dia + turno + grupamento, pra um intervalo de datas — extraído de
// gerarDocumentoDespachantesV2 (v2EscalaController) pra ser reaproveitado
// também pelas Escalas Consolidadas, sem duplicar a regra de negócio.
//
// Efetivo de cada turno = vínculo mensal vigente naquele dia
// (v2_grupamento_usuario) já ajustado pelas substituições pontuais
// registradas pra aquele data+turno+grupamento (v2_escala_substituicao) —
// mesma regra usada no "Painel do Dia" do frontend, calculada aqui pro
// intervalo inteiro de uma vez.
//
// NÃO preenche lacunas a partir do ciclo (fn_v2_gerar_escala) — quem
// precisar disso chama antes de usar este helper (ver
// gerarDocumentoDespachantesV2, que roda o preenchimento e depois usa
// este helper só pra montar a grade).
// -----------------------------------------------------------------------

// Converte um valor de coluna DATE devolvido pelo pg (chega como objeto
// Date, à meia-noite UTC) em "YYYY-MM-DD" — mesma convenção usada em todo
// o resto do módulo (o front sempre recebe/envia string, nunca Date cru).
function paraDataISO(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor).slice(0, 10);
}

// Retorna { escalas, dias } — "escalas" é a lista achatada (útil quando
// quem chama precisa das linhas brutas, ex: pra anotar restrição por
// membro); "dias" já vem agrupado por data com os turnos ordenados.
async function montarGradeNominal(dataInicio, dataFim) {
  const escalas = await database("v2_escala")
    .join("v2_turno", "v2_turno.id_turno", "v2_escala.fk_id_turno")
    .join("v2_grupamento", "v2_grupamento.id_grupamento", "v2_escala.fk_id_grupamento")
    .whereBetween("v2_escala.data", [dataInicio, dataFim])
    .select(
      "v2_escala.data",
      "v2_escala.fk_id_turno",
      "v2_turno.numero as turno",
      "v2_turno.hora_inicio",
      "v2_turno.hora_fim",
      "v2_escala.fk_id_grupamento",
      "v2_grupamento.sigla as grupamento",
    )
    .orderBy(["v2_escala.data", "v2_turno.numero"]);

  if (escalas.length === 0) {
    return { escalas: [], dias: [] };
  }

  // Vínculos mensais com QUALQUER sobreposição com o período — carrega já
  // com patente/matrícula/nome pra não precisar de 1 query por linha da
  // grade (cardinalidade baixa: o efetivo total do setor, não por dia).
  const vinculos = await database("v2_grupamento_usuario")
    .join("users", "users.id_user", "v2_grupamento_usuario.fk_id_usuario")
    .leftJoin("tbl_patentes", "tbl_patentes.id_patente", "users.id_patente")
    .where("v2_grupamento_usuario.data_inicio", "<=", dataFim)
    .andWhere(function () {
      this.whereNull("v2_grupamento_usuario.data_fim").orWhere(
        "v2_grupamento_usuario.data_fim",
        ">=",
        dataInicio,
      );
    })
    .select(
      "v2_grupamento_usuario.fk_id_grupamento",
      "v2_grupamento_usuario.data_inicio",
      "v2_grupamento_usuario.data_fim",
      "users.id_user",
      "users.nome",
      "users.nome_guerra",
      "users.matricula",
      "tbl_patentes.id_patente",
      "tbl_patentes.sigla_patente",
    );

  // Substituições pontuais (adição/exclusão/permuta) dentro do período —
  // join duplo dos DOIS lados (quem sai E quem entra) com identidade
  // completa: além de montar o efetivo final, as Escalas Consolidadas
  // precisam mostrar o ajuste em si (quem saiu de folga, quem entrou numa
  // permuta), não só o resultado líquido.
  const substituicoes = await database("v2_escala_substituicao as sub")
    .whereBetween("sub.data", [dataInicio, dataFim])
    .leftJoin("users as u_sai", "u_sai.id_user", "sub.fk_id_usuario_sai")
    .leftJoin("tbl_patentes as p_sai", "p_sai.id_patente", "u_sai.id_patente")
    .leftJoin("users as u_entra", "u_entra.id_user", "sub.fk_id_usuario_entra")
    .leftJoin("tbl_patentes as p_entra", "p_entra.id_patente", "u_entra.id_patente")
    .select(
      "sub.id_substituicao",
      "sub.data",
      "sub.fk_id_turno",
      "sub.fk_id_grupamento",
      "sub.fk_id_usuario_sai",
      "sub.fk_id_usuario_entra",
      "sub.tipo",
      "sub.observacao",
      "u_sai.nome as sai_nome",
      "u_sai.nome_guerra as sai_nome_guerra",
      "u_sai.matricula as sai_matricula",
      "p_sai.sigla_patente as sai_sigla_patente",
      "u_entra.nome as entra_nome",
      "u_entra.nome_guerra as entra_nome_guerra",
      "u_entra.matricula as entra_matricula",
      "p_entra.id_patente as entra_id_patente",
      "p_entra.sigla_patente as entra_sigla_patente",
    );

  const subsPorChave = new Map();
  for (const s of substituicoes) {
    const chave = `${paraDataISO(s.data)}_${s.fk_id_turno}_${s.fk_id_grupamento}`;
    if (!subsPorChave.has(chave)) subsPorChave.set(chave, []);
    subsPorChave.get(chave).push(s);
  }

  function montarEfetivoDoTurno(linha) {
    const dataLinha = paraDataISO(linha.data);

    const idsQueSairam = new Set();
    const entradas = [];
    const chave = `${dataLinha}_${linha.fk_id_turno}_${linha.fk_id_grupamento}`;
    for (const s of subsPorChave.get(chave) || []) {
      if (s.fk_id_usuario_sai) idsQueSairam.add(s.fk_id_usuario_sai);
      if (s.fk_id_usuario_entra) {
        entradas.push({
          id_user: s.fk_id_usuario_entra,
          nome: s.entra_nome,
          nome_guerra: s.entra_nome_guerra,
          matricula: s.entra_matricula,
          id_patente: s.entra_id_patente,
          sigla_patente: s.entra_sigla_patente,
          origem: s.tipo === "PERMUTA" ? "PERMUTA" : "ADICAO",
        });
      }
    }

    const base = vinculos
      .filter((v) => v.fk_id_grupamento === linha.fk_id_grupamento)
      .filter((v) => paraDataISO(v.data_inicio) <= dataLinha)
      .filter((v) => !v.data_fim || paraDataISO(v.data_fim) >= dataLinha)
      .filter((v) => !idsQueSairam.has(v.id_user))
      .map((v) => ({ ...v, origem: "NORMAL" }));

    const membros = [...base, ...entradas];
    membros.sort((a, b) => {
      const patenteA = a.id_patente ?? 999;
      const patenteB = b.id_patente ?? 999;
      if (patenteA !== patenteB) return patenteA - patenteB;
      return (a.nome_guerra || a.nome || "").localeCompare(b.nome_guerra || b.nome || "");
    });

    return membros.map((m) => ({
      id_user: m.id_user,
      sigla_patente: m.sigla_patente,
      matricula: m.matricula,
      nome_guerra: m.nome_guerra,
      nome: m.nome,
      origem: m.origem, // NORMAL | ADICAO | PERMUTA — pra quem quiser distinguir na tela
    }));
  }

  // Ajustes pontuais do turno, pra auditoria (quem saiu de folga, quem
  // entrou numa permuta) — diferente de "membros", que já é só o
  // resultado líquido final.
  function montarAjustesDoTurno(linha) {
    const dataLinha = paraDataISO(linha.data);
    const chave = `${dataLinha}_${linha.fk_id_turno}_${linha.fk_id_grupamento}`;
    return (subsPorChave.get(chave) || []).map((s) => ({
      id_substituicao: s.id_substituicao,
      tipo: s.tipo, // ADICAO | EXCLUSAO | PERMUTA
      observacao: s.observacao,
      sai: s.fk_id_usuario_sai
        ? {
            id_user: s.fk_id_usuario_sai,
            sigla_patente: s.sai_sigla_patente,
            matricula: s.sai_matricula,
            nome_guerra: s.sai_nome_guerra,
            nome: s.sai_nome,
          }
        : null,
      entra: s.fk_id_usuario_entra
        ? {
            id_user: s.fk_id_usuario_entra,
            sigla_patente: s.entra_sigla_patente,
            matricula: s.entra_matricula,
            nome_guerra: s.entra_nome_guerra,
            nome: s.entra_nome,
          }
        : null,
    }));
  }

  const diasMap = new Map();
  for (const linha of escalas) {
    const dataISO = paraDataISO(linha.data);
    if (!diasMap.has(dataISO)) diasMap.set(dataISO, []);
    diasMap.get(dataISO).push({
      turno: linha.turno,
      fk_id_turno: linha.fk_id_turno,
      hora_inicio: linha.hora_inicio,
      hora_fim: linha.hora_fim,
      fk_id_grupamento: linha.fk_id_grupamento,
      grupamento: linha.grupamento,
      membros: montarEfetivoDoTurno(linha),
      ajustes: montarAjustesDoTurno(linha),
    });
  }

  const dias = Array.from(diasMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([data, turnos]) => ({ data, turnos: turnos.sort((a, b) => a.turno - b.turno) }));

  return { escalas, dias };
}

module.exports = { montarGradeNominal, paraDataISO };
