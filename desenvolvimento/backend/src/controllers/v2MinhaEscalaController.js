const database = require("../database/db");
const { analisarMeusDias } = require("../functions/analisarMeusDias");
const {
  buscarAfastamentosDetalhadosNoPeriodo,
  avaliarRestricoesEmLote,
} = require("../functions/validarAlocacaoAfastamento");

const JANELA_PADRAO_DIAS = 60;
const JANELA_MAXIMA_DIAS = 1830; // ~5 anos
const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

// Colunas `date` do Postgres chegam como Date (meia-noite local) — mesma
// normalização usada em v2PermutaController.
function dataParaISO(valor) {
  if (typeof valor === "string") return valor.slice(0, 10);
  const d = new Date(valor);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function somarDias(dataISO, dias) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return dataParaISO(new Date(ano, mes - 1, dia + dias));
}

function diferencaDias(inicioISO, fimISO) {
  const [a1, m1, d1] = inicioISO.split("-").map(Number);
  const [a2, m2, d2] = fimISO.split("-").map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

function dataValida(iso) {
  if (!REGEX_DATA.test(iso)) return false;
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function hojeISO() {
  return dataParaISO(new Date());
}

const hhmm = (valor) => String(valor).slice(0, 5);

function montarDia(linha) {
  return {
    data: dataParaISO(linha.data),
    turno: Number(linha.turno),
    fk_id_turno: Number(linha.fk_id_turno),
    fk_id_grupamento: Number(linha.fk_id_grupamento),
    grupamento: linha.grupamento,
    hora_inicio: hhmm(linha.hora_inicio),
    hora_fim: hhmm(linha.hora_fim),
  };
}

const PROTOCOLO_DA_SUBSTITUICAO = database.raw(`(
  SELECT p.protocolo FROM v2_permuta_solicitacao p
  WHERE p.fk_id_substituicao_solicitante = s.id_substituicao
     OR p.fk_id_substituicao_alvo = s.id_substituicao
  LIMIT 1
) as protocolo`);

const COLUNAS_SUBSTITUICAO = [
  "s.id_substituicao",
  "s.data",
  "s.fk_id_turno",
  "s.fk_id_grupamento",
  "s.tipo",
  "s.observacao",
  "t.numero as turno",
  "t.hora_inicio",
  "t.hora_fim",
  "g.sigla as grupamento",
];

function substituicoesBase() {
  return database("v2_escala_substituicao as s")
    .join("v2_turno as t", "t.id_turno", "s.fk_id_turno")
    .join("v2_grupamento as g", "g.id_grupamento", "s.fk_id_grupamento");
}

// -----------------------------------------------------------------------
// GET /minha-escala/meus-dias?data_inicio=AAAA-MM-DD&data_fim=AAAA-MM-DD
// Lista cronológica dos dias de serviço do militar logado (escala normal,
// permutas aprovadas, inclusões manuais), com os dias cedidos/dispensados,
// os dias previstos por permutas pendentes e os conflitos de cada dia.
// -----------------------------------------------------------------------
async function listarMeusDiasV2(req, res) {
  try {
    const idUsuario = req.user.id_user;

    const dataInicio = String(req.query.data_inicio || hojeISO());
    const dataFim = String(req.query.data_fim || somarDias(dataInicio, JANELA_PADRAO_DIAS));

    if (!dataValida(dataInicio) || !dataValida(dataFim)) {
      return res.status(400).json({ msg: "Datas inválidas. Use o formato AAAA-MM-DD." });
    }
    if (dataFim < dataInicio) {
      return res.status(400).json({ msg: "A data final não pode ser anterior à data inicial." });
    }
    if (diferencaDias(dataInicio, dataFim) > JANELA_MAXIMA_DIAS) {
      return res.status(400).json({ msg: `O período máximo é de 5 anos (${JANELA_MAXIMA_DIAS} dias).` });
    }

    // Busca um dia a mais em cada ponta pra detectar conflito de horário
    // com turnos vizinhos (ex: 3º turno que termina de manhã no dia seguinte).
    const buscaInicio = somarDias(dataInicio, -1);
    const buscaFim = somarDias(dataFim, 1);

    const [porVinculo, subsEntra, subsSai, pendentesBrutas, afastamentosPorUsuario] = await Promise.all([
      database("v2_escala")
        .select(
          "v2_escala.data",
          "v2_escala.fk_id_turno",
          "v2_escala.fk_id_grupamento",
          "v2_turno.numero as turno",
          "v2_turno.hora_inicio",
          "v2_turno.hora_fim",
          "v2_grupamento.sigla as grupamento",
        )
        .join("v2_turno", "v2_turno.id_turno", "v2_escala.fk_id_turno")
        .join("v2_grupamento", "v2_grupamento.id_grupamento", "v2_escala.fk_id_grupamento")
        .join("v2_grupamento_usuario", "v2_grupamento_usuario.fk_id_grupamento", "v2_escala.fk_id_grupamento")
        .where("v2_grupamento_usuario.fk_id_usuario", idUsuario)
        .andWhere("v2_escala.data", ">=", database.ref("v2_grupamento_usuario.data_inicio"))
        .andWhere(function () {
          this.whereNull("v2_grupamento_usuario.data_fim").orWhere(
            "v2_escala.data",
            "<",
            database.ref("v2_grupamento_usuario.data_fim"),
          );
        })
        .whereBetween("v2_escala.data", [buscaInicio, buscaFim])
        .whereNotExists(function () {
          this.select(1)
            .from("v2_escala_substituicao as x")
            .whereRaw("x.data = v2_escala.data")
            .andWhereRaw("x.fk_id_turno = v2_escala.fk_id_turno")
            .andWhere("x.fk_id_usuario_sai", idUsuario);
        }),

      substituicoesBase()
        .leftJoin("users as u", "u.id_user", "s.fk_id_usuario_sai")
        .select(...COLUNAS_SUBSTITUICAO, "u.nome as outro_nome", "u.nome_guerra as outro_guerra", PROTOCOLO_DA_SUBSTITUICAO)
        .where("s.fk_id_usuario_entra", idUsuario)
        .whereBetween("s.data", [buscaInicio, buscaFim]),

      substituicoesBase()
        .leftJoin("users as u", "u.id_user", "s.fk_id_usuario_entra")
        .select(...COLUNAS_SUBSTITUICAO, "u.nome as outro_nome", "u.nome_guerra as outro_guerra", PROTOCOLO_DA_SUBSTITUICAO)
        .where("s.fk_id_usuario_sai", idUsuario)
        .whereBetween("s.data", [buscaInicio, buscaFim]),

      database("v2_permuta_solicitacao as p")
        .join("users as us", "us.id_user", "p.fk_id_usuario_solicitante")
        .join("users as ua", "ua.id_user", "p.fk_id_usuario_alvo")
        .join("v2_turno as ts", "ts.id_turno", "p.fk_id_turno_solicitante")
        .join("v2_turno as ta", "ta.id_turno", "p.fk_id_turno_alvo")
        .join("v2_grupamento as gs", "gs.id_grupamento", "p.fk_id_grupamento_solicitante")
        .join("v2_grupamento as ga", "ga.id_grupamento", "p.fk_id_grupamento_alvo")
        .select(
          "p.protocolo",
          "p.status",
          "p.fk_id_usuario_solicitante",
          "p.data_solicitante",
          "p.fk_id_turno_solicitante",
          "p.fk_id_grupamento_solicitante",
          "ts.numero as turno_solicitante",
          "ts.hora_inicio as inicio_solicitante",
          "ts.hora_fim as fim_solicitante",
          "gs.sigla as grupamento_solicitante",
          "us.nome as nome_solicitante",
          "us.nome_guerra as guerra_solicitante",
          "p.data_alvo",
          "p.fk_id_turno_alvo",
          "p.fk_id_grupamento_alvo",
          "ta.numero as turno_alvo",
          "ta.hora_inicio as inicio_alvo",
          "ta.hora_fim as fim_alvo",
          "ga.sigla as grupamento_alvo",
          "ua.nome as nome_alvo",
          "ua.nome_guerra as guerra_alvo",
        )
        .whereIn("p.status", ["AGUARDANDO_ALVO", "AGUARDANDO_ADMIN"])
        .andWhere(function () {
          this.where("p.fk_id_usuario_solicitante", idUsuario).orWhere("p.fk_id_usuario_alvo", idUsuario);
        })
        .andWhere(function () {
          this.whereBetween("p.data_solicitante", [buscaInicio, buscaFim]).orWhereBetween("p.data_alvo", [
            buscaInicio,
            buscaFim,
          ]);
        }),

      buscarAfastamentosDetalhadosNoPeriodo(buscaInicio, buscaFim),
    ]);

    const itens = [];
    for (const linha of porVinculo) itens.push({ ...montarDia(linha), tipo: "ESCALA", contraparte: null, protocolo: null, observacao: null });

    for (const linha of subsEntra) {
      itens.push({
        ...montarDia(linha),
        tipo: linha.tipo === "PERMUTA" ? "PERMUTA" : "ADICAO",
        contraparte: linha.outro_nome ? { nome: linha.outro_nome, nome_guerra: linha.outro_guerra } : null,
        protocolo: linha.protocolo || null,
        observacao: linha.observacao || null,
      });
    }

    for (const linha of subsSai) {
      itens.push({
        ...montarDia(linha),
        tipo: linha.tipo === "PERMUTA" ? "CEDIDO" : "DISPENSA",
        contraparte: linha.outro_nome ? { nome: linha.outro_nome, nome_guerra: linha.outro_guerra } : null,
        protocolo: linha.protocolo || null,
        observacao: linha.observacao || null,
      });
    }

    const pendentes = pendentesBrutas.map((p) => {
      const souSolicitante = Number(p.fk_id_usuario_solicitante) === Number(idUsuario);
      const doSolicitante = montarDia({
        data: p.data_solicitante,
        turno: p.turno_solicitante,
        fk_id_turno: p.fk_id_turno_solicitante,
        fk_id_grupamento: p.fk_id_grupamento_solicitante,
        grupamento: p.grupamento_solicitante,
        hora_inicio: p.inicio_solicitante,
        hora_fim: p.fim_solicitante,
      });
      const doAlvo = montarDia({
        data: p.data_alvo,
        turno: p.turno_alvo,
        fk_id_turno: p.fk_id_turno_alvo,
        fk_id_grupamento: p.fk_id_grupamento_alvo,
        grupamento: p.grupamento_alvo,
        hora_inicio: p.inicio_alvo,
        hora_fim: p.fim_alvo,
      });
      return {
        protocolo: p.protocolo,
        status: p.status,
        papel: souSolicitante ? "SOLICITANTE" : "ALVO",
        contraparte: souSolicitante
          ? { nome: p.nome_alvo, nome_guerra: p.guerra_alvo }
          : { nome: p.nome_solicitante, nome_guerra: p.guerra_solicitante },
        minha: souSolicitante ? doSolicitante : doAlvo,
        outra: souSolicitante ? doAlvo : doSolicitante,
      };
    });

    const resultado = analisarMeusDias({
      itens,
      pendentes,
      dataInicio,
      dataFim,
      avaliarAfastamento: (item) =>
        avaliarRestricoesEmLote(afastamentosPorUsuario, idUsuario, item.data, item.fk_id_turno, item.fk_id_grupamento),
    });

    return res.status(200).json({ data_inicio: dataInicio, data_fim: dataFim, ...resultado });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

module.exports = { listarMeusDiasV2 };
