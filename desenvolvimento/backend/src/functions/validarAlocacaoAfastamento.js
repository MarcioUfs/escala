const database = require("../database/db");

// -----------------------------------------------------------------------
// Módulo de afastamentos é 100% informativo (decisão de negócio explícita):
// nada aqui bloqueia a criação de substituição/permuta — só devolve avisos
// pro frontend mostrar antes/depois da confirmação. Por isso nenhuma função
// deste arquivo lança erro por causa de uma restrição; o pior caso é
// devolver a lista de avisos vazia.
// -----------------------------------------------------------------------

function formatarDataBR(data) {
  if (!data) return null;
  const iso = typeof data === "string" ? data : data.toISOString();
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

const RES_TIPO_LABEL = {
  FERIAS: "Férias regulamentares",
  FERIAS_LEI_109: "Férias regulamentares/LE (Lei 109)",
  LICENCA_ESPECIAL: "Licença especial",
  CURSO: "Curso",
  RESTRICAO_GERAL: "Restrição geral",
  RESTRICAO_NOTURNA: "Restrição noturna",
  ESCALA_DIFERENCIADA: "Escala diferenciada",
  REDUCAO_CARGA: "Redução de carga horária",
  AFASTAMENTO: "Afastamento",
};

function montarMensagem(afastamento) {
  const rotulo = RES_TIPO_LABEL[afastamento.tipo] || afastamento.tipo;
  const partes = [rotulo];
  if (afastamento.bgo_referencia) partes.push(`BGO ${afastamento.bgo_referencia}`);
  if (afastamento.data_fim) partes.push(`até ${formatarDataBR(afastamento.data_fim)}`);
  else partes.push("prazo indeterminado");
  if (afastamento.observacao) partes.push(afastamento.observacao);
  return partes.join(" — ");
}

// Busca, em lote, os afastamentos ativos de vários usuários numa data —
// usado pela listagem de membros do grupamento (aviso "tem restrição hoje",
// sem checar turno/equipe especificamente).
async function buscarAfastamentosAtivosPorUsuarios(idsUsuario, dataReferencia) {
  if (!idsUsuario || idsUsuario.length === 0) return new Map();

  const linhas = await database("v2_afastamentos")
    .whereIn("fk_id_usuario", idsUsuario)
    .andWhere("ativo", true)
    .andWhere("data_inicio", "<=", dataReferencia)
    .andWhere(function () {
      this.whereNull("data_fim").orWhere("data_fim", ">=", dataReferencia);
    })
    .select("id_afastamento", "fk_id_usuario", "tipo", "bgo_referencia", "data_fim", "observacao");

  const porUsuario = new Map();
  for (const linha of linhas) {
    const lista = porUsuario.get(linha.fk_id_usuario) || [];
    lista.push({
      id_afastamento: linha.id_afastamento,
      tipo: linha.tipo,
      rotulo: RES_TIPO_LABEL[linha.tipo] || linha.tipo,
      mensagem: montarMensagem(linha),
    });
    porUsuario.set(linha.fk_id_usuario, lista);
  }
  return porUsuario;
}

// Regra pura, sem banco — decide se UM afastamento específico "pega" numa
// alocação turno+grupamento específica, e com que nível de aviso. Extraída
// de avaliarRestricoesAtivas() pra ser reaproveitada tanto ali (1 consulta
// por vez, usado nas telas de adicionar/permutar) quanto em
// avaliarRestricoesEmLote() (dados já carregados em memória, usado pra
// montar um mês inteiro de uma vez sem 1 query por célula da grade).
function avaliarAplicabilidade(afastamento, turnosDoAfastamento, gruposDoAfastamento, fk_id_turno, fk_id_grupamento) {
  // Sem turno nem grupamento associado (ex: RESTRIÇÃO GERAL, férias,
  // curso...) — é só informativo, sempre avisa, não há "violação".
  if (turnosDoAfastamento.length === 0 && gruposDoAfastamento.length === 0) {
    return { aplica: true, nivel: "informativo" };
  }

  // Restrição tem grupamento(s) associado(s) e o grupamento da alocação
  // não está entre eles -> não se aplica aqui.
  if (gruposDoAfastamento.length > 0 && !gruposDoAfastamento.includes(Number(fk_id_grupamento))) {
    return { aplica: false };
  }

  if (turnosDoAfastamento.length === 0) {
    // Só restrito por grupamento, sem turno específico.
    return { aplica: true, nivel: "atencao" };
  }

  const turnoEstaNaLista = turnosDoAfastamento.includes(Number(fk_id_turno));
  const violado =
    (afastamento.modo_restricao === "SOMENTE" && !turnoEstaNaLista) ||
    (afastamento.modo_restricao === "EXCETO" && turnoEstaNaLista);

  return violado ? { aplica: true, nivel: "atencao" } : { aplica: false };
}

// Avalia, pra um usuário + dia/turno/grupamento específicos, se existe
// alguma restrição relevante — usado na hora de adicionar/permutar um
// militar num dia da escala. Sempre devolve avisos, nunca bloqueia.
async function avaliarRestricoesAtivas(fk_id_usuario, data, fk_id_turno, fk_id_grupamento) {
  const afastamentos = await database("v2_afastamentos")
    .where({ fk_id_usuario, ativo: true })
    .andWhere("data_inicio", "<=", data)
    .andWhere(function () {
      this.whereNull("data_fim").orWhere("data_fim", ">=", data);
    });

  if (afastamentos.length === 0) return [];

  const ids = afastamentos.map((a) => a.id_afastamento);
  const [turnosLinhas, gruposLinhas] = await Promise.all([
    database("v2_afastamento_turno").whereIn("fk_id_afastamento", ids).select("fk_id_afastamento", "fk_id_turno"),
    database("v2_afastamento_grupamento")
      .whereIn("fk_id_afastamento", ids)
      .select("fk_id_afastamento", "fk_id_grupamento"),
  ]);

  const avisos = [];

  for (const afastamento of afastamentos) {
    const turnosDoAfastamento = turnosLinhas
      .filter((t) => t.fk_id_afastamento === afastamento.id_afastamento)
      .map((t) => t.fk_id_turno);
    const gruposDoAfastamento = gruposLinhas
      .filter((g) => g.fk_id_afastamento === afastamento.id_afastamento)
      .map((g) => g.fk_id_grupamento);

    const resultado = avaliarAplicabilidade(
      afastamento,
      turnosDoAfastamento,
      gruposDoAfastamento,
      fk_id_turno,
      fk_id_grupamento,
    );
    if (resultado.aplica) {
      avisos.push({ tipo: afastamento.tipo, nivel: resultado.nivel, mensagem: montarMensagem(afastamento) });
    }
  }

  return avisos;
}

// Busca em UMA leva só todos os afastamentos ativos que tocam o período
// (qualquer usuário), já com turnos/grupamentos associados, indexados por
// usuário — base pra avaliar restrição dia a dia sem 1 query por célula.
async function buscarAfastamentosDetalhadosNoPeriodo(dataInicio, dataFim) {
  const afastamentos = await database("v2_afastamentos")
    .where("ativo", true)
    .andWhere("data_inicio", "<=", dataFim)
    .andWhere(function () {
      this.whereNull("data_fim").orWhere("data_fim", ">=", dataInicio);
    })
    .select(
      "id_afastamento",
      "fk_id_usuario",
      "tipo",
      "modo_restricao",
      "data_inicio",
      "data_fim",
      "bgo_referencia",
      "observacao",
    );

  const idsAfastamento = afastamentos.map((a) => a.id_afastamento);
  const [turnosLinhas, gruposLinhas] = idsAfastamento.length
    ? await Promise.all([
        database("v2_afastamento_turno")
          .whereIn("fk_id_afastamento", idsAfastamento)
          .select("fk_id_afastamento", "fk_id_turno"),
        database("v2_afastamento_grupamento")
          .whereIn("fk_id_afastamento", idsAfastamento)
          .select("fk_id_afastamento", "fk_id_grupamento"),
      ])
    : [[], []];

  const porUsuario = new Map();
  for (const afastamento of afastamentos) {
    const lista = porUsuario.get(afastamento.fk_id_usuario) || [];
    lista.push({
      ...afastamento,
      turnosDoAfastamento: turnosLinhas
        .filter((t) => t.fk_id_afastamento === afastamento.id_afastamento)
        .map((t) => t.fk_id_turno),
      gruposDoAfastamento: gruposLinhas
        .filter((g) => g.fk_id_afastamento === afastamento.id_afastamento)
        .map((g) => g.fk_id_grupamento),
    });
    porUsuario.set(afastamento.fk_id_usuario, lista);
  }
  return porUsuario;
}

// Versão em memória de avaliarRestricoesAtivas() — recebe o Map já
// carregado por buscarAfastamentosDetalhadosNoPeriodo() e resolve pra um
// usuário+dia+turno+grupamento específicos sem tocar o banco de novo.
function avaliarRestricoesEmLote(afastamentosPorUsuario, fk_id_usuario, data, fk_id_turno, fk_id_grupamento) {
  const afastamentos = afastamentosPorUsuario.get(fk_id_usuario) || [];
  const avisos = [];

  for (const afastamento of afastamentos) {
    const dataInicioISO =
      afastamento.data_inicio instanceof Date
        ? afastamento.data_inicio.toISOString().slice(0, 10)
        : String(afastamento.data_inicio).slice(0, 10);
    const dataFimISO = afastamento.data_fim
      ? afastamento.data_fim instanceof Date
        ? afastamento.data_fim.toISOString().slice(0, 10)
        : String(afastamento.data_fim).slice(0, 10)
      : null;
    if (data < dataInicioISO || (dataFimISO && data > dataFimISO)) continue;

    const resultado = avaliarAplicabilidade(
      afastamento,
      afastamento.turnosDoAfastamento,
      afastamento.gruposDoAfastamento,
      fk_id_turno,
      fk_id_grupamento,
    );
    if (resultado.aplica) {
      avisos.push({ tipo: afastamento.tipo, nivel: resultado.nivel, mensagem: montarMensagem(afastamento) });
    }
  }

  return avisos;
}

module.exports = {
  avaliarRestricoesAtivas,
  buscarAfastamentosAtivosPorUsuarios,
  buscarAfastamentosDetalhadosNoPeriodo,
  avaliarRestricoesEmLote,
  montarMensagem,
};
