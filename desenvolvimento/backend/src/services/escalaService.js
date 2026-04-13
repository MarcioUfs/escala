const database = require("../database/db");

/*
  A ideia do "dia linear" é usada para facilitar ciclos.
  Exemplo:
  - data inicial: 2026-01-31 => dia_linear = 1 dentro da geração
  - dia seguinte: 2026-02-01 => dia_linear = 2
  Isso simplifica folgas e avanço do ciclo, mesmo atravessando meses.
*/

function criarDataLocal(dataStr, horaStr = "00:00") {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const [hora, minuto] = horaStr.split(":").map(Number);
  return new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
}

function adicionarHoras(data, horas) {
  const novaData = new Date(data);
  novaData.setHours(novaData.getHours() + horas);
  return novaData;
}

function formatarDataISO(data) {
  const pad = (n) => String(n).padStart(2, "0");

  const ano = data.getFullYear();
  const mes = pad(data.getMonth() + 1);
  const dia = pad(data.getDate());
  const hora = pad(data.getHours());
  const minuto = pad(data.getMinutes());
  const segundo = pad(data.getSeconds());

  return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
}

function validarDias(dias) {
  if (!Array.isArray(dias) || dias.length === 0) {
    throw new Error("O array de dias deve conter apenas números inteiros positivos");
  }

  for (const dia of dias) {
    // CORRIGIDO: &lt;= por <=
    if (!Number.isInteger(dia) || dia <= 0) {
      throw new Error("O array de dias deve conter apenas números inteiros positivos");
    }
  }
}

function gerarDatasPorDiasDoMes(ano, mes, dias) {
  validarDias(dias);

  const datas = dias.map((dia) => {
    const data = new Date(ano, mes - 1, dia);
    return {
      dia_mes: dia,
      data_str: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`,
    };
  });

  return datas.sort((a, b) => a.dia_mes - b.dia_mes);
}

function gerarDatasPorPeriodo(dataInicial, quantidadeDias) {
  if (!dataInicial || Number.isNaN(Date.parse(dataInicial))) {
    throw new Error("data_inicial inválida");
  }

  // CORRIGIDO: &lt;= por <=
  if (!quantidadeDias || quantidadeDias <= 0) {
    throw new Error("quantidade_dias deve ser maior que zero");
  }

  const datas = [];
  const inicio = criarDataLocal(dataInicial, "00:00");

  // CORRIGIDO: &lt; por <
  for (let i = 0; i < quantidadeDias; i++) {
    const atual = new Date(inicio);
    atual.setDate(inicio.getDate() + i);

    datas.push({
      dia_linear: i + 1,
      data_str: `${atual.getFullYear()}-${String(atual.getMonth() + 1).padStart(2, "0")}-${String(atual.getDate()).padStart(2, "0")}`,
    });
  }

  return datas;
}

async function criarGuarnicao({ nome, codigo, capacidade_maxima, descricao }) {
  const existente = await database("guarnicoes")
    .where({ codigo })
    .first();

  if (existente) {
    throw new Error("Já existe uma guarnição com esse código");
  }

  const [guarnicao] = await database("guarnicoes")
    .insert({
      nome,
      codigo,
      capacidade_maxima,
      descricao,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(["id", "nome", "codigo", "capacidade_maxima", "descricao"]);

  return guarnicao;
}

async function listarGuarnicoes() {
  return await database("guarnicoes")
    .select("*")
    .orderBy("nome", "asc");
}

async function listarModelosEscala() {
  return await database("modelos_escala")
    .select("*")
    .orderBy("nome", "asc");
}

async function buscarGuarnicao(id_guarnicao) {
  const guarnicao = await database("guarnicoes")
    .where({ id: id_guarnicao })
    .first();

  if (!guarnicao) {
    throw new Error("Guarnição não encontrada");
  }

  return guarnicao;
}

async function buscarModeloPorCodigo(modelo_codigo) {
  const modelo = await database("modelos_escala")
    .where({ codigo: modelo_codigo, ativo: true })
    .first();

  if (!modelo) {
    throw new Error("Modelo de escala não encontrado");
  }

  return modelo;
}

async function buscarMilitaresAtivos(idsMilitares) {
  const militares = await database("users")
    .select("id_user", "nome", "matricula", "cpf", "is_active")
    .whereIn("id_user", idsMilitares)
    .andWhere({ is_active: true });

  if (!militares.length) {
    throw new Error("Nenhum militar ativo encontrado");
  }

  if (militares.length !== idsMilitares.length) {
    throw new Error("Existem militares inválidos ou inativos na lista enviada");
  }

  return militares;
}

function gerarSlotsModelo8h24h72h(datas) {
  const slots = [];

  // CORRIGIDO: &lt; por <
  for (let i = 0; i < datas.length; i++) {
    const referencia = datas[i];
    const passoCiclo = i % 4;

    if (passoCiclo === 3) {
      continue;
    }

    let horaInicio = "07:00";
    let duracaoHoras = 8;
    let nomeTurno = "manha";

    if (passoCiclo === 1) {
      horaInicio = "15:00";
      nomeTurno = "tarde";
    }

    if (passoCiclo === 2) {
      horaInicio = "23:00";
      nomeTurno = "noite";
    }

    const inicio = criarDataLocal(referencia.data_str, horaInicio);
    const fim = adicionarHoras(inicio, duracaoHoras);

    slots.push({
      dia_linear: referencia.dia_linear || i + 1,
      data_referencia: referencia.data_str,
      turno_nome: nomeTurno,
      hora_inicio: horaInicio,
      hora_fim: `${String(fim.getHours()).padStart(2, "0")}:${String(fim.getMinutes()).padStart(2, "0")}`,
      data_inicio: formatarDataISO(inicio),
      data_fim: formatarDataISO(fim),
      tipo_servico: "8H_24H_72H",
      observacao: nomeTurno === "noite"
        ? "Turno noturno com encerramento no dia seguinte"
        : null,
    });
  }

  return slots;
}

function gerarSlotsModelo12x48x72(datas) {
  const slots = [];

  const ciclo = [
    { tipo: "servico", hora_inicio: "07:00", duracao: 12, turno_nome: "diurno_12h" },
    { tipo: "folga" },
    { tipo: "folga" },
    { tipo: "servico", hora_inicio: "19:00", duracao: 12, turno_nome: "noturno_12h" },
    { tipo: "folga" },
    { tipo: "folga" },
    { tipo: "folga" },
  ];

  // CORRIGIDO: &lt; por <
  for (let i = 0; i < datas.length; i++) {
    const referencia = datas[i];
    const passo = ciclo[i % ciclo.length];

    if (passo.tipo === "folga") {
      continue;
    }

    const inicio = criarDataLocal(referencia.data_str, passo.hora_inicio);
    const fim = adicionarHoras(inicio, passo.duracao);

    slots.push({
      dia_linear: referencia.dia_linear || i + 1,
      data_referencia: referencia.data_str,
      turno_nome: passo.turno_nome,
      hora_inicio: passo.hora_inicio,
      hora_fim: `${String(fim.getHours()).padStart(2, "0")}:${String(fim.getMinutes()).padStart(2, "0")}`,
      data_inicio: formatarDataISO(inicio),
      data_fim: formatarDataISO(fim),
      tipo_servico: "12X48_12X72",
      observacao: passo.turno_nome === "noturno_12h"
        ? "Turno noturno com encerramento no dia seguinte"
        : null,
    });
  }

  return slots;
}

function gerarSlotsPorModelo(modeloCodigo, datas) {
  if (modeloCodigo === "8H_24H_72H") {
    return gerarSlotsModelo8h24h72h(datas);
  }

  if (modeloCodigo === "12X48_12X72") {
    return gerarSlotsModelo12x48x72(datas);
  }

  throw new Error("Modelo de escala ainda não implementado");
}

function distribuirMilitaresNosSlots(slots, militares, capacidadeMaxima) {
  const distribuicao = [];
  let ponteiroMilitar = 0;

  for (const slot of slots) {
    const militaresDoSlot = [];

    // CORRIGIDO: &lt; por <
    for (let i = 0; i < capacidadeMaxima; i++) {
      const militar = militares[ponteiroMilitar % militares.length];
      militaresDoSlot.push(militar);
      ponteiroMilitar++;
    }

    distribuicao.push({
      slot,
      militares: militaresDoSlot,
    });
  }

  return distribuicao;
}

async function gerarEscala({
  nome_escala,
  ano,
  mes,
  id_guarnicao,
  modelo_codigo,
  militares,
  dias,
  data_inicial,
  quantidade_dias,
  id_admin_criador,
}) {
  const guarnicao = await buscarGuarnicao(id_guarnicao);
  const modelo = await buscarModeloPorCodigo(modelo_codigo);
  const militaresAtivos = await buscarMilitaresAtivos(militares);

  // CORRIGIDO: Lógica invertida no original (&lt;). 
  // Se a lista de militares disponíveis for MENOR que a capacidade necessária por slot, deve dar erro.
  if (militaresAtivos.length < guarnicao.capacidade_maxima) {
    throw new Error("Quantidade de militares ativos insuficiente para a capacidade da guarnição");
  }

  let datasBase = [];

  if (Array.isArray(dias) && dias.length > 0) {
    const datasDoMes = gerarDatasPorDiasDoMes(ano, mes, dias);
    datasBase = datasDoMes.map((item, index) => ({
      dia_linear: index + 1,
      data_str: item.data_str,
    }));
  } else {
    datasBase = gerarDatasPorPeriodo(data_inicial, quantity_dias);
  }

  const slots = gerarSlotsPorModelo(modelo.codigo, datasBase);

  const distribuicao = distribuirMilitaresNosSlots(
    slots,
    militaresAtivos,
    guarnicao.capacidade_maxima
  );

  const trx = await database.transaction();

  try {
    const [escala] = await trx("escalas")
      .insert({
        nome: nome_escala,
        ano,
        mes,
        id_guarnicao,
        id_modelo_escala: modelo.id,
        id_admin_criador,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*");

    for (const item of distribuicao) {
      const [escalaItem] = await trx("escala_itens")
        .insert({
          id_escala: escala.id,
          dia_linear: item.slot.dia_linear,
          data_referencia: item.slot.data_referencia,
          turno_nome: item.slot.turno_nome,
          tipo_servico: item.slot.tipo_servico,
          hora_inicio: item.slot.hora_inicio,
          hora_fim: item.slot.hora_fim,
          data_inicio: item.slot.data_inicio,
          data_fim: item.slot.data_fim,
          id_guarnicao: guarnicao.id,
          capacidade_prevista: guarnicao.capacidade_maxima,
          observacao: item.slot.observacao,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");

      const militaresInsert = item.militares.map((militar) => ({
        id_escala_item: escalaItem.id,
        id_user: militar.id_user,
        nome_militar_snapshot: militar.nome,
        matricula_militar_snapshot: militar.matricula,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      await trx("escala_item_militares").insert(militaresInsert);
    }

    await trx.commit();

    const itens = await database("escala_itens")
      .where({ id_escala: escala.id })
      .orderBy("dia_linear", "asc")
      .orderBy("data_inicio", "asc");

    const itensComMilitares = [];

    for (const item of itens) {
      const militaresDoItem = await database("escala_item_militares")
        .where({ id_escala_item: item.id })
        .orderBy("id", "asc");

      itensComMilitares.push({
        ...item,
        militares: militaresDoItem,
      });
    }

    return {
      escala,
      guarnicao,
      modelo,
      itens: itensComMilitares,
    };
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

module.exports = {
  criarGuarnicao,
  listarGuarnicoes,
  listarModelosEscala,
  gerarEscala,
};