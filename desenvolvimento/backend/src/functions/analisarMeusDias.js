// Monta a lista cronológica "meus dias de serviço" e detecta conflitos.
// Função pura (sem banco) — recebe os dados já carregados, o que permite
// testar todos os cenários de conflito com dados sintéticos.
//
// itens: dias já efetivados, cada um com
//   { tipo, data:'AAAA-MM-DD', turno, fk_id_turno, fk_id_grupamento,
//     grupamento, hora_inicio:'HH:MM', hora_fim:'HH:MM',
//     contraparte:{nome,nome_guerra}|null, protocolo|null, observacao|null }
//   tipo: ESCALA | PERMUTA (recebi o dia de alguém) | ADICAO (incluído à
//         mão) | CEDIDO (passei o dia numa permuta aprovada) | DISPENSA
// pendentes: permutas ainda em andamento (aguardando alvo/admin)
//   { protocolo, status, papel, contraparte, minha:{...dia que eu cederia},
//     outra:{...dia que eu receberia} }  (minha/outra têm a mesma forma
//     dos itens: data, turno, fk_id_turno, fk_id_grupamento, grupamento,
//     hora_inicio, hora_fim)
// avaliarAfastamento(item) -> [{ tipo, nivel, mensagem }]

const TIPOS_SERVICO = ["ESCALA", "PERMUTA", "ADICAO"];
const MIN_INTERVALO_MIN = 60;
// Afastamentos que impedem o serviço de verdade; os demais (restrições)
// são só atenção — o módulo de afastamentos é informativo.
const AFASTAMENTOS_GRAVES = ["FERIAS", "FERIAS_LEI_109", "LICENCA_ESPECIAL", "CURSO", "AFASTAMENTO"];

const chave = (x) => `${x.data}|${x.fk_id_turno}`;
const nomeDe = (c) => (c ? c.nome_guerra || c.nome : "outro militar");
const dataBR = (iso) => iso.split("-").reverse().join("/");

function paraMinutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function intervalo(item) {
  const [ano, mes, dia] = item.data.split("-").map(Number);
  const inicio = Date.UTC(ano, mes - 1, dia) / 60000 + paraMinutos(item.hora_inicio);
  let duracao = (paraMinutos(item.hora_fim) - paraMinutos(item.hora_inicio) + 1440) % 1440;
  if (duracao === 0) duracao = 1440;
  return [inicio, inicio + duracao];
}

function descricaoOrigem(item) {
  if (item.tipo === "PERMUTA") return `permuta com ${nomeDe(item.contraparte)}`;
  if (item.tipo === "ADICAO") return "inclusão manual na escala";
  if (item.tipo === "PREVISTO") return `permuta pendente ${item.protocolo}`;
  return "escala normal";
}

function analisarMeusDias({ itens, pendentes, dataInicio, dataFim, avaliarAfastamento }) {
  const dias = new Map();
  const dentro = (d) => d >= dataInicio && d <= dataFim;
  const diaDe = (d) => {
    if (!dias.has(d)) dias.set(d, { data: d, itens: [], avisos: [] });
    return dias.get(d);
  };
  const avisar = (d, codigo, gravidade, mensagem) => {
    if (!dentro(d)) return;
    const lista = diaDe(d).avisos;
    if (!lista.some((a) => a.codigo === codigo && a.mensagem === mensagem)) {
      lista.push({ codigo, gravidade, mensagem });
    }
  };

  const efetivos = itens.filter((i) => TIPOS_SERVICO.includes(i.tipo));
  const cedidos = itens.filter((i) => i.tipo === "CEDIDO");

  for (const item of itens) {
    if (dentro(item.data)) diaDe(item.data).itens.push({ ...item, permutas_pendentes: [] });
  }

  // Dias que eu receberia se as permutas pendentes fossem aprovadas.
  const previstos = pendentes.map((p) => ({
    ...p.outra,
    tipo: "PREVISTO",
    contraparte: p.contraparte,
    protocolo: p.protocolo,
    status_permuta: p.status,
    observacao: null,
  }));
  for (const previsto of previstos) {
    if (dentro(previsto.data)) diaDe(previsto.data).itens.push({ ...previsto, permutas_pendentes: [] });
  }

  // Dia que eu cederia: marca no próprio item e valida que ele ainda existe.
  for (const p of pendentes) {
    if (!dentro(p.minha.data)) continue;
    const meuItem = diaDe(p.minha.data).itens.find(
      (i) => TIPOS_SERVICO.includes(i.tipo) && i.fk_id_turno === p.minha.fk_id_turno,
    );
    if (meuItem) {
      meuItem.permutas_pendentes.push({
        protocolo: p.protocolo,
        status: p.status,
        papel: p.papel,
        contraparte: p.contraparte,
        recebe: { data: p.outra.data, turno: p.outra.turno },
      });
      continue;
    }
    const jaCedido = cedidos.find((c) => chave(c) === chave(p.minha));
    if (jaCedido) {
      avisar(
        p.minha.data,
        "PERMUTA_DIA_JA_CEDIDO",
        "erro",
        `A permuta ${p.protocolo} (com ${nomeDe(p.contraparte)}) refere-se ao ${p.minha.turno}º turno deste dia, mas ele já foi cedido${
          jaCedido.protocolo ? ` na permuta aprovada ${jaCedido.protocolo}` : ""
        } a ${nomeDe(jaCedido.contraparte)}.`,
      );
    } else {
      avisar(
        p.minha.data,
        "PERMUTA_DIA_NAO_ESCALADO",
        "erro",
        `A permuta ${p.protocolo} (com ${nomeDe(p.contraparte)}) refere-se ao ${p.minha.turno}º turno deste dia, mas você não está escalado(a) nele.`,
      );
    }
  }

  // Mais de uma permuta pendente mexendo no mesmo dia/turno.
  const referencias = new Map();
  for (const p of pendentes) {
    for (const ref of [p.minha, p.outra]) {
      const lista = referencias.get(chave(ref)) || [];
      if (!lista.some((x) => x.protocolo === p.protocolo)) {
        lista.push({ protocolo: p.protocolo, contraparte: p.contraparte, ref });
      }
      referencias.set(chave(ref), lista);
    }
  }
  for (const lista of referencias.values()) {
    if (lista.length < 2) continue;
    const { ref } = lista[0];
    avisar(
      ref.data,
      "PERMUTA_DUPLICADA",
      "erro",
      `Mais de uma permuta pendente envolve o ${ref.turno}º turno deste dia: ${lista
        .map((x) => `protocolo ${x.protocolo} com ${nomeDe(x.contraparte)}`)
        .join("; ")}.`,
    );
  }

  // Permuta pendente que traria um dia/turno em que eu já estou escalado.
  for (const p of pendentes) {
    if (efetivos.some((e) => chave(e) === chave(p.outra))) {
      avisar(
        p.outra.data,
        "PERMUTA_CONFLITA_COM_ESCALA",
        "erro",
        `A permuta ${p.protocolo} (com ${nomeDe(p.contraparte)}) traria para você o ${p.outra.turno}º turno deste dia, mas você já está escalado(a) nele.`,
      );
    }
  }

  // Mesmo dia/turno efetivado mais de uma vez (ex: escala normal + permuta).
  const porChave = new Map();
  for (const e of efetivos) porChave.set(chave(e), [...(porChave.get(chave(e)) || []), e]);
  for (const grupo of porChave.values()) {
    if (grupo.length < 2) continue;
    avisar(
      grupo[0].data,
      "DUPLICIDADE_ESCALA",
      "erro",
      `Você aparece escalado(a) ${grupo.length} vezes no ${grupo[0].turno}º turno deste dia (${grupo
        .map(descricaoOrigem)
        .join(" + ")}).`,
    );
  }

  // Conflitos de horário entre todos os turnos que eu teria (efetivos +
  // previstos por permuta pendente), sem contar o mesmo dia/turno duas vezes.
  const unicos = new Map();
  for (const item of [...efetivos, ...previstos]) if (!unicos.has(chave(item))) unicos.set(chave(item), item);
  const lista = [...unicos.values()]
    .map((item) => ({ item, faixa: intervalo(item) }))
    .sort((a, b) => a.faixa[0] - b.faixa[0]);

  const descreverTurno = (item) =>
    `${item.turno}º turno de ${dataBR(item.data)} (${item.hora_inicio}–${item.hora_fim})`;
  const nota = (a, b) => {
    const previsto = [a, b].find((x) => x.tipo === "PREVISTO");
    return previsto ? ` Considera o dia previsto pela permuta pendente ${previsto.protocolo}.` : "";
  };

  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i];
      const b = lista[j];
      const folga = b.faixa[0] - a.faixa[1];
      let codigo = null;
      let gravidade = null;
      let mensagem = null;

      if (folga < 0) {
        codigo = "SOBREPOSICAO_TURNOS";
        gravidade = "erro";
        mensagem = `Sobreposição de horários: ${descreverTurno(a.item)} coincide com ${descreverTurno(b.item)}.`;
      } else if (folga < MIN_INTERVALO_MIN) {
        codigo = "SEM_INTERVALO";
        gravidade = "aviso";
        mensagem = `Turnos seguidos sem intervalo: ${descreverTurno(a.item)} e ${descreverTurno(b.item)}.`;
      } else if (a.item.data === b.item.data) {
        codigo = "MAIS_DE_UM_TURNO";
        gravidade = "aviso";
        mensagem = `Mais de um turno no mesmo dia: ${descreverTurno(a.item)} e ${descreverTurno(b.item)}.`;
      }

      if (codigo) {
        avisar(a.item.data, codigo, gravidade, mensagem + nota(a.item, b.item));
        avisar(b.item.data, codigo, gravidade, mensagem + nota(a.item, b.item));
      }
    }
  }

  // Afastamentos e restrições cadastrados para os dias de serviço.
  if (avaliarAfastamento) {
    for (const item of unicos.values()) {
      if (!dentro(item.data)) continue;
      for (const res of avaliarAfastamento(item)) {
        avisar(
          item.data,
          "AFASTAMENTO",
          AFASTAMENTOS_GRAVES.includes(res.tipo) ? "erro" : "aviso",
          `${item.turno}º turno coincide com: ${res.mensagem}${
            item.tipo === "PREVISTO" ? ` (dia previsto pela permuta pendente ${item.protocolo})` : ""
          }.`,
        );
      }
    }
  }

  const ordem = { ESCALA: 0, PERMUTA: 0, ADICAO: 0, PREVISTO: 1, CEDIDO: 2, DISPENSA: 2 };
  const resultado = [...dias.values()].sort((a, b) => a.data.localeCompare(b.data));
  for (const dia of resultado) {
    dia.itens.sort((a, b) => a.turno - b.turno || ordem[a.tipo] - ordem[b.tipo]);
    dia.avisos.sort((a, b) => (a.gravidade === b.gravidade ? 0 : a.gravidade === "erro" ? -1 : 1));
  }

  return {
    dias: resultado,
    resumo: {
      total_dias_servico: resultado.filter((d) => d.itens.some((i) => TIPOS_SERVICO.includes(i.tipo))).length,
      total_com_aviso: resultado.filter((d) => d.avisos.length > 0).length,
    },
  };
}

module.exports = { analisarMeusDias };
