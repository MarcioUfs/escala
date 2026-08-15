const database = require("../database/db");
const limparEspaco = require("../functions/limparEspacos");
const gerarProtocoloPermuta = require("../functions/gerarProtocoloPermuta");

const STATUS = {
  AGUARDANDO_ALVO: "AGUARDANDO_ALVO",
  RECUSADA_ALVO: "RECUSADA_ALVO",
  AGUARDANDO_ADMIN: "AGUARDANDO_ADMIN",
  APROVADA: "APROVADA",
  RECUSADA_ADMIN: "RECUSADA_ADMIN",
};

const JANELA_PADRAO_DIAS = 60;
const JANELA_MAXIMA_DIAS = 180;

function hojeISO() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(
    hoje.getDate(),
  ).padStart(2, "0")}`;
}

function somarDias(dataISO, dias) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia + dias);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(
    data.getDate(),
  ).padStart(2, "0")}`;
}

// -----------------------------------------------------------------------
// Agenda "real" de um usuário: dias/turnos em que ele está efetivamente
// escalado no período, já considerando vínculo mensal (v2_grupamento_
// usuario) E os desvios pontuais (v2_escala_substituicao) — mesmo cálculo
// que o PainelDoDia faz no frontend, só que centralizado aqui pra servir
// tanto a agenda do solicitante quanto a do alvo na tela de permuta.
// -----------------------------------------------------------------------
async function buscarAgendaUsuario(idUsuario, dataInicio, dataFim) {
  const porVinculo = await database("v2_escala")
    .select(
      "v2_escala.data",
      "v2_escala.fk_id_turno",
      "v2_turno.numero as turno",
      "v2_turno.hora_inicio",
      "v2_turno.hora_fim",
      "v2_escala.fk_id_grupamento",
      "v2_grupamento.sigla as grupamento",
    )
    .join("v2_turno", "v2_turno.id_turno", "v2_escala.fk_id_turno")
    .join("v2_grupamento", "v2_grupamento.id_grupamento", "v2_escala.fk_id_grupamento")
    .join(
      "v2_grupamento_usuario",
      "v2_grupamento_usuario.fk_id_grupamento",
      "v2_escala.fk_id_grupamento",
    )
    .where("v2_grupamento_usuario.fk_id_usuario", idUsuario)
    .andWhere("v2_escala.data", ">=", database.ref("v2_grupamento_usuario.data_inicio"))
    .andWhere(function () {
      this.whereNull("v2_grupamento_usuario.data_fim").orWhere(
        "v2_escala.data",
        "<",
        database.ref("v2_grupamento_usuario.data_fim"),
      );
    })
    .whereBetween("v2_escala.data", [dataInicio, dataFim])
    .whereNotExists(function () {
      this.select(1)
        .from("v2_escala_substituicao as s")
        .whereRaw("s.data = v2_escala.data")
        .andWhereRaw("s.fk_id_turno = v2_escala.fk_id_turno")
        .andWhere("s.fk_id_usuario_sai", idUsuario);
    });

  const porSubstituicao = await database("v2_escala_substituicao")
    .select(
      "v2_escala_substituicao.data",
      "v2_escala_substituicao.fk_id_turno",
      "v2_turno.numero as turno",
      "v2_turno.hora_inicio",
      "v2_turno.hora_fim",
      "v2_escala_substituicao.fk_id_grupamento",
      "v2_grupamento.sigla as grupamento",
    )
    .join("v2_turno", "v2_turno.id_turno", "v2_escala_substituicao.fk_id_turno")
    .join("v2_grupamento", "v2_grupamento.id_grupamento", "v2_escala_substituicao.fk_id_grupamento")
    .where("v2_escala_substituicao.fk_id_usuario_entra", idUsuario)
    .whereBetween("v2_escala_substituicao.data", [dataInicio, dataFim]);

  const agenda = [...porVinculo, ...porSubstituicao];
  agenda.sort((a, b) => {
    const dataComp = new Date(a.data) - new Date(b.data);
    if (dataComp !== 0) return dataComp;
    return a.turno - b.turno;
  });
  return agenda;
}

// Confere se (data, turno, grupamento) realmente está na agenda calculada
// do usuário — proteção contra o front mandar uma combinação que já não é
// mais válida (o próprio usuário perdeu o dia por outro motivo entre abrir
// o modal e confirmar o envio).
function estaNaAgenda(agenda, data, fk_id_turno, fk_id_grupamento) {
  const dataAlvoISO = new Date(data).toISOString().slice(0, 10);
  return agenda.some((item) => {
    const itemISO = new Date(item.data).toISOString().slice(0, 10);
    return (
      itemISO === dataAlvoISO &&
      Number(item.fk_id_turno) === Number(fk_id_turno) &&
      Number(item.fk_id_grupamento) === Number(fk_id_grupamento)
    );
  });
}

async function validarUsuarioAtivo(id_user) {
  return database("users").where({ id_user, is_active: true }).first();
}

// Já existe alguma solicitação em andamento (aguardando alvo ou aguardando
// admin) reservando esse exato usuário+data+turno, seja como solicitante
// ou como alvo? Evita comprometer o mesmo dia em duas permutas ao mesmo
// tempo.
async function existePermutaEmAndamento(id_user, data, fk_id_turno) {
  return database("v2_permuta_solicitacao")
    .whereIn("status", [STATUS.AGUARDANDO_ALVO, STATUS.AGUARDANDO_ADMIN])
    .andWhere(function () {
      this.where(function () {
        this.where("fk_id_usuario_solicitante", id_user)
          .andWhere("data_solicitante", data)
          .andWhere("fk_id_turno_solicitante", fk_id_turno);
      }).orWhere(function () {
        this.where("fk_id_usuario_alvo", id_user)
          .andWhere("data_alvo", data)
          .andWhere("fk_id_turno_alvo", fk_id_turno);
      });
    })
    .first();
}

const SELECT_SOLICITACAO_DETALHADA = [
  "v2_permuta_solicitacao.id_permuta",
  "v2_permuta_solicitacao.protocolo",
  "v2_permuta_solicitacao.status",
  "v2_permuta_solicitacao.motivo_solicitacao",
  "v2_permuta_solicitacao.motivo_recusa_alvo",
  "v2_permuta_solicitacao.motivo_recusa_admin",
  "v2_permuta_solicitacao.lido_solicitante",
  "v2_permuta_solicitacao.lido_alvo",
  "v2_permuta_solicitacao.created_at",
  "v2_permuta_solicitacao.updated_at",
  "v2_permuta_solicitacao.data_solicitante",
  "v2_permuta_solicitacao.fk_id_usuario_solicitante",
  "u_solicitante.nome as nome_solicitante",
  "u_solicitante.nome_guerra as nome_guerra_solicitante",
  "t_solicitante.numero as turno_solicitante",
  "g_solicitante.sigla as grupamento_solicitante",
  "v2_permuta_solicitacao.data_alvo",
  "v2_permuta_solicitacao.fk_id_usuario_alvo",
  "u_alvo.nome as nome_alvo",
  "u_alvo.nome_guerra as nome_guerra_alvo",
  "t_alvo.numero as turno_alvo",
  "g_alvo.sigla as grupamento_alvo",
];

function queryBaseSolicitacoes() {
  return database("v2_permuta_solicitacao")
    .join("users as u_solicitante", "u_solicitante.id_user", "v2_permuta_solicitacao.fk_id_usuario_solicitante")
    .join("v2_turno as t_solicitante", "t_solicitante.id_turno", "v2_permuta_solicitacao.fk_id_turno_solicitante")
    .join(
      "v2_grupamento as g_solicitante",
      "g_solicitante.id_grupamento",
      "v2_permuta_solicitacao.fk_id_grupamento_solicitante",
    )
    .join("users as u_alvo", "u_alvo.id_user", "v2_permuta_solicitacao.fk_id_usuario_alvo")
    .join("v2_turno as t_alvo", "t_alvo.id_turno", "v2_permuta_solicitacao.fk_id_turno_alvo")
    .join("v2_grupamento as g_alvo", "g_alvo.id_grupamento", "v2_permuta_solicitacao.fk_id_grupamento_alvo");
}

// -----------------------------------------------------------------------
// GET /permutas/agenda/:idUsuario?dias=60
// -----------------------------------------------------------------------
async function listarAgendaV2(req, res) {
  try {
    const { idUsuario } = req.params;
    const dias = Math.min(Number(req.query.dias) || JANELA_PADRAO_DIAS, JANELA_MAXIMA_DIAS);

    const usuario = await validarUsuarioAtivo(idUsuario);
    if (!usuario) {
      return res.status(404).json({ msg: "Militar não encontrado ou inativo" });
    }

    const dataInicio = hojeISO();
    const dataFim = somarDias(dataInicio, dias);
    const agenda = await buscarAgendaUsuario(idUsuario, dataInicio, dataFim);

    return res.status(200).json({ agenda });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

// -----------------------------------------------------------------------
// POST /permutas
// -----------------------------------------------------------------------
async function criarSolicitacaoPermutaV2(req, res) {
  try {
    const fk_id_usuario_solicitante = req.user.id_user;
    const {
      fk_id_usuario_alvo,
      data_solicitante,
      fk_id_turno_solicitante,
      fk_id_grupamento_solicitante,
      data_alvo,
      fk_id_turno_alvo,
      fk_id_grupamento_alvo,
      motivo,
    } = req.body;

    if (
      !fk_id_usuario_alvo ||
      !data_solicitante ||
      !fk_id_turno_solicitante ||
      !fk_id_grupamento_solicitante ||
      !data_alvo ||
      !fk_id_turno_alvo ||
      !fk_id_grupamento_alvo
    ) {
      return res.status(400).json({
        msg: "fk_id_usuario_alvo, data_solicitante, fk_id_turno_solicitante, fk_id_grupamento_solicitante, data_alvo, fk_id_turno_alvo e fk_id_grupamento_alvo são obrigatórios",
      });
    }

    if (Number(fk_id_usuario_alvo) === Number(fk_id_usuario_solicitante)) {
      return res.status(400).json({ msg: "Não é possível permutar consigo mesmo" });
    }

    const motivoLimpo = limparEspaco(motivo || "");
    if (motivoLimpo.length < 5) {
      return res.status(400).json({ msg: "Motivo da solicitação precisa ter pelo menos 5 letras" });
    }

    const alvo = await validarUsuarioAtivo(fk_id_usuario_alvo);
    if (!alvo) {
      return res.status(404).json({ msg: "Militar alvo não encontrado ou inativo" });
    }

    const dataInicio = hojeISO();
    const dataFim = somarDias(dataInicio, JANELA_MAXIMA_DIAS);

    const [agendaSolicitante, agendaAlvo] = await Promise.all([
      buscarAgendaUsuario(fk_id_usuario_solicitante, dataInicio, dataFim),
      buscarAgendaUsuario(fk_id_usuario_alvo, dataInicio, dataFim),
    ]);

    if (!estaNaAgenda(agendaSolicitante, data_solicitante, fk_id_turno_solicitante, fk_id_grupamento_solicitante)) {
      return res.status(409).json({
        msg: "Esse dia/turno não está mais na sua agenda atual — atualize a tela e tente novamente",
      });
    }
    if (!estaNaAgenda(agendaAlvo, data_alvo, fk_id_turno_alvo, fk_id_grupamento_alvo)) {
      return res.status(409).json({
        msg: "Esse dia/turno não está mais na agenda atual do militar alvo — atualize a tela e tente novamente",
      });
    }

    const [conflitoSolicitante, conflitoAlvo] = await Promise.all([
      existePermutaEmAndamento(fk_id_usuario_solicitante, data_solicitante, fk_id_turno_solicitante),
      existePermutaEmAndamento(fk_id_usuario_alvo, data_alvo, fk_id_turno_alvo),
    ]);
    if (conflitoSolicitante || conflitoAlvo) {
      return res.status(409).json({
        msg: "Já existe uma solicitação de permuta em andamento envolvendo um desses dias/turnos",
      });
    }

    const protocolo = await database.transaction(async (trx) => {
      const protocoloGerado = await gerarProtocoloPermuta(trx);

      await trx("v2_permuta_solicitacao").insert({
        protocolo: protocoloGerado,
        fk_id_usuario_solicitante,
        data_solicitante,
        fk_id_turno_solicitante,
        fk_id_grupamento_solicitante,
        fk_id_usuario_alvo,
        data_alvo,
        fk_id_turno_alvo,
        fk_id_grupamento_alvo,
        motivo_solicitacao: motivoLimpo,
        status: STATUS.AGUARDANDO_ALVO,
        lido_solicitante: true,
        lido_alvo: false,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return protocoloGerado;
    });

    return res.status(201).json({
      msg: "Solicitação de permuta enviada! Aguardando confirmação do militar alvo.",
      protocolo,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

// -----------------------------------------------------------------------
// GET /permutas/minhas
// -----------------------------------------------------------------------
async function listarMinhasSolicitacoesV2(req, res) {
  try {
    const idUsuario = req.user.id_user;

    const solicitacoes = await queryBaseSolicitacoes()
      .select(SELECT_SOLICITACAO_DETALHADA)
      .where("v2_permuta_solicitacao.fk_id_usuario_solicitante", idUsuario)
      .orWhere("v2_permuta_solicitacao.fk_id_usuario_alvo", idUsuario)
      .orderBy("v2_permuta_solicitacao.created_at", "desc");

    const comPapel = solicitacoes.map((s) => ({
      ...s,
      meu_papel: Number(s.fk_id_usuario_solicitante) === Number(idUsuario) ? "SOLICITANTE" : "ALVO",
    }));

    return res.status(200).json(comPapel);
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

// -----------------------------------------------------------------------
// PUT /permutas/:id/confirmar  (o alvo confere e confirma)
// -----------------------------------------------------------------------
async function confirmarAlvoV2(req, res) {
  try {
    const { id } = req.params;
    const idUsuario = req.user.id_user;

    const solicitacao = await database("v2_permuta_solicitacao").where({ id_permuta: id }).first();
    if (!solicitacao) {
      return res.status(404).json({ msg: "Solicitação não encontrada" });
    }
    if (Number(solicitacao.fk_id_usuario_alvo) !== Number(idUsuario)) {
      return res.status(403).json({ msg: "Essa solicitação não é direcionada a você" });
    }
    if (solicitacao.status !== STATUS.AGUARDANDO_ALVO) {
      return res.status(409).json({ msg: "Essa solicitação já não está mais aguardando sua confirmação" });
    }

    await database("v2_permuta_solicitacao")
      .where({ id_permuta: id })
      .update({
        status: STATUS.AGUARDANDO_ADMIN,
        lido_alvo: true,
        updated_at: new Date(),
      });

    return res.status(200).json({ msg: "Confirmado! A solicitação foi enviada ao administrador para análise." });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

// -----------------------------------------------------------------------
// PUT /permutas/:id/recusar  (o alvo recusa, com motivo)
// -----------------------------------------------------------------------
async function recusarAlvoV2(req, res) {
  try {
    const { id } = req.params;
    const idUsuario = req.user.id_user;
    const motivoRecusa = limparEspaco(req.body.motivo_recusa || "");

    if (motivoRecusa.length < 5) {
      return res.status(400).json({ msg: "Motivo da recusa precisa ter pelo menos 5 letras" });
    }

    const solicitacao = await database("v2_permuta_solicitacao").where({ id_permuta: id }).first();
    if (!solicitacao) {
      return res.status(404).json({ msg: "Solicitação não encontrada" });
    }
    if (Number(solicitacao.fk_id_usuario_alvo) !== Number(idUsuario)) {
      return res.status(403).json({ msg: "Essa solicitação não é direcionada a você" });
    }
    if (solicitacao.status !== STATUS.AGUARDANDO_ALVO) {
      return res.status(409).json({ msg: "Essa solicitação já não está mais aguardando sua confirmação" });
    }

    await database("v2_permuta_solicitacao")
      .where({ id_permuta: id })
      .update({
        status: STATUS.RECUSADA_ALVO,
        motivo_recusa_alvo: motivoRecusa,
        lido_alvo: true,
        lido_solicitante: false,
        updated_at: new Date(),
      });

    return res.status(200).json({ msg: "Solicitação recusada. O solicitante foi avisado do motivo." });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

// -----------------------------------------------------------------------
// PUT /permutas/:id/marcar-lida
// -----------------------------------------------------------------------
async function marcarLidaV2(req, res) {
  try {
    const { id } = req.params;
    const idUsuario = req.user.id_user;

    const solicitacao = await database("v2_permuta_solicitacao").where({ id_permuta: id }).first();
    if (!solicitacao) {
      return res.status(404).json({ msg: "Solicitação não encontrada" });
    }

    if (Number(solicitacao.fk_id_usuario_solicitante) === Number(idUsuario)) {
      await database("v2_permuta_solicitacao").where({ id_permuta: id }).update({ lido_solicitante: true });
    } else if (Number(solicitacao.fk_id_usuario_alvo) === Number(idUsuario)) {
      await database("v2_permuta_solicitacao").where({ id_permuta: id }).update({ lido_alvo: true });
    } else {
      return res.status(403).json({ msg: "Essa solicitação não envolve você" });
    }

    return res.status(200).json({ msg: "Marcada como lida" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

// -----------------------------------------------------------------------
// GET /permutas/pendencias  (badges do usuário logado)
// -----------------------------------------------------------------------
async function contarPendenciasV2(req, res) {
  try {
    const idUsuario = req.user.id_user;

    const [{ count: pendenteAcao }] = await database("v2_permuta_solicitacao")
      .where({ fk_id_usuario_alvo: idUsuario, status: STATUS.AGUARDANDO_ALVO })
      .count("* as count");

    const [{ count: naoLidas }] = await database("v2_permuta_solicitacao")
      .whereIn("status", [STATUS.APROVADA, STATUS.RECUSADA_ADMIN, STATUS.RECUSADA_ALVO])
      .andWhere(function () {
        this.where(function () {
          this.where("fk_id_usuario_solicitante", idUsuario).andWhere("lido_solicitante", false);
        }).orWhere(function () {
          this.where("fk_id_usuario_alvo", idUsuario).andWhere("lido_alvo", false);
        });
      })
      .count("* as count");

    const pendenteAcaoNum = Number(pendenteAcao);
    const naoLidasNum = Number(naoLidas);

    return res.status(200).json({
      pendente_acao: pendenteAcaoNum,
      atualizacoes_nao_lidas: naoLidasNum,
      total: pendenteAcaoNum + naoLidasNum,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

// -----------------------------------------------------------------------
// GET /permutas/admin/pendentes
// -----------------------------------------------------------------------
async function listarPendentesAdminV2(req, res) {
  try {
    const solicitacoes = await queryBaseSolicitacoes()
      .select(SELECT_SOLICITACAO_DETALHADA)
      .where("v2_permuta_solicitacao.status", STATUS.AGUARDANDO_ADMIN)
      .orderBy("v2_permuta_solicitacao.created_at", "asc");

    return res.status(200).json(solicitacoes);
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

// -----------------------------------------------------------------------
// GET /permutas/admin/pendencias
// -----------------------------------------------------------------------
async function contarPendenciasAdminV2(req, res) {
  try {
    const [{ count }] = await database("v2_permuta_solicitacao")
      .where({ status: STATUS.AGUARDANDO_ADMIN })
      .count("* as count");

    return res.status(200).json({ pendentes: Number(count) });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

// -----------------------------------------------------------------------
// PUT /permutas/:id/aprovar  (admin aceita -> gera as 2 substituições)
// -----------------------------------------------------------------------
async function aprovarPermutaV2(req, res) {
  try {
    const { id } = req.params;
    const idAdmin = req.user.id_admin;

    const solicitacao = await database("v2_permuta_solicitacao").where({ id_permuta: id }).first();
    if (!solicitacao) {
      return res.status(404).json({ msg: "Solicitação não encontrada" });
    }
    if (solicitacao.status !== STATUS.AGUARDANDO_ADMIN) {
      return res.status(409).json({ msg: "Essa solicitação não está aguardando análise do admin" });
    }

    // Reconfere na hora da aprovação — pode ter passado tempo desde a
    // confirmação do alvo e algo mudou (outro ajuste no meio tempo).
    const conflitoLadoSolicitante = await database("v2_escala_substituicao")
      .where({ data: solicitacao.data_solicitante, fk_id_turno: solicitacao.fk_id_turno_solicitante })
      .andWhere(function () {
        this.where({ fk_id_usuario_sai: solicitacao.fk_id_usuario_solicitante }).orWhere({
          fk_id_usuario_entra: solicitacao.fk_id_usuario_solicitante,
        });
      })
      .first();
    const conflitoLadoAlvo = await database("v2_escala_substituicao")
      .where({ data: solicitacao.data_alvo, fk_id_turno: solicitacao.fk_id_turno_alvo })
      .andWhere(function () {
        this.where({ fk_id_usuario_sai: solicitacao.fk_id_usuario_alvo }).orWhere({
          fk_id_usuario_entra: solicitacao.fk_id_usuario_alvo,
        });
      })
      .first();

    if (conflitoLadoSolicitante || conflitoLadoAlvo) {
      return res.status(409).json({
        msg: "Já existe uma substituição registrada pra um dos dias/turnos envolvidos. Verifique a escala antes de aprovar.",
      });
    }

    const observacao = `Permuta aprovada — protocolo ${solicitacao.protocolo}`;

    await database.transaction(async (trx) => {
      const [idSubstituicaoSolicitante] = await trx("v2_escala_substituicao")
        .insert({
          data: solicitacao.data_solicitante,
          fk_id_turno: solicitacao.fk_id_turno_solicitante,
          fk_id_grupamento: solicitacao.fk_id_grupamento_solicitante,
          fk_id_usuario_sai: solicitacao.fk_id_usuario_solicitante,
          fk_id_usuario_entra: solicitacao.fk_id_usuario_alvo,
          tipo: "PERMUTA",
          observacao,
          fk_id_admin: idAdmin,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("id_substituicao");

      const [idSubstituicaoAlvo] = await trx("v2_escala_substituicao")
        .insert({
          data: solicitacao.data_alvo,
          fk_id_turno: solicitacao.fk_id_turno_alvo,
          fk_id_grupamento: solicitacao.fk_id_grupamento_alvo,
          fk_id_usuario_sai: solicitacao.fk_id_usuario_alvo,
          fk_id_usuario_entra: solicitacao.fk_id_usuario_solicitante,
          tipo: "PERMUTA",
          observacao,
          fk_id_admin: idAdmin,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("id_substituicao");

      await trx("v2_permuta_solicitacao")
        .where({ id_permuta: id })
        .update({
          status: STATUS.APROVADA,
          fk_id_admin_analise: idAdmin,
          fk_id_substituicao_solicitante:
            idSubstituicaoSolicitante.id_substituicao || idSubstituicaoSolicitante,
          fk_id_substituicao_alvo: idSubstituicaoAlvo.id_substituicao || idSubstituicaoAlvo,
          lido_solicitante: false,
          lido_alvo: false,
          updated_at: new Date(),
        });
    });

    return res.status(200).json({ msg: "Permuta aprovada e incluída na escala!" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

// -----------------------------------------------------------------------
// PUT /permutas/:id/rejeitar
// -----------------------------------------------------------------------
async function rejeitarPermutaV2(req, res) {
  try {
    const { id } = req.params;
    const idAdmin = req.user.id_admin;
    const motivoRecusaAdmin = limparEspaco(req.body.motivo_recusa_admin || "") || null;

    const solicitacao = await database("v2_permuta_solicitacao").where({ id_permuta: id }).first();
    if (!solicitacao) {
      return res.status(404).json({ msg: "Solicitação não encontrada" });
    }
    if (solicitacao.status !== STATUS.AGUARDANDO_ADMIN) {
      return res.status(409).json({ msg: "Essa solicitação não está aguardando análise do admin" });
    }

    await database("v2_permuta_solicitacao")
      .where({ id_permuta: id })
      .update({
        status: STATUS.RECUSADA_ADMIN,
        motivo_recusa_admin: motivoRecusaAdmin,
        fk_id_admin_analise: idAdmin,
        lido_solicitante: false,
        lido_alvo: false,
        updated_at: new Date(),
      });

    return res.status(200).json({ msg: "Permuta rejeitada. Os envolvidos foram avisados." });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

module.exports = {
  listarAgendaV2,
  criarSolicitacaoPermutaV2,
  listarMinhasSolicitacoesV2,
  confirmarAlvoV2,
  recusarAlvoV2,
  marcarLidaV2,
  contarPendenciasV2,
  listarPendentesAdminV2,
  contarPendenciasAdminV2,
  aprovarPermutaV2,
  rejeitarPermutaV2,
};
