const database = require("../database/db");
const limparEspaco = require("../functions/limparEspacos");
const validarDataUsuario = require("../functions/validarDataUsuario");
const { VALORES_TIPOS_AFASTAMENTO, MODOS_RESTRICAO } = require("../constants/tiposAfastamento");

// -----------------------------------------------------------------------
// Módulo de Afastamentos e Restrições
// Modela as seções do boletim mensal de justificativa do cartão-
// alimentação (férias, licença especial, cursos, restrições gerais/
// noturnas, escala diferenciada, redução de carga horária, afastamento).
//
// Regra de negócio confirmada: é 100% informativo. Nenhuma função aqui
// bloqueia a criação de substituição/permuta — os avisos são só visuais
// (ver src/functions/validarAlocacaoAfastamento.js).
// -----------------------------------------------------------------------

function validarDataObrigatoria(valor, rotulo) {
  const resultado = validarDataUsuario(valor);
  if (!resultado.valido) {
    return { valido: false, msg: `${rotulo}: ${resultado.motivo}` };
  }
  return { valido: true, data: resultado.dataFormatada };
}

async function validarUsuarioAtivo(fk_id_usuario) {
  const usuario = await database("users").where({ id_user: fk_id_usuario, is_active: true }).first();
  return Boolean(usuario);
}

async function validarTurnosExistem(idsTurno) {
  if (!idsTurno || idsTurno.length === 0) return true;
  const encontrados = await database("v2_turno")
    .whereIn("id_turno", idsTurno)
    .andWhere("is_active", true)
    .select("id_turno");
  return encontrados.length === idsTurno.length;
}

async function validarGrupamentosExistem(idsGrupamento) {
  if (!idsGrupamento || idsGrupamento.length === 0) return true;
  const encontrados = await database("v2_grupamento")
    .whereIn("id_grupamento", idsGrupamento)
    .andWhere("is_active", true)
    .select("id_grupamento");
  return encontrados.length === idsGrupamento.length;
}

async function validarMotivosExistem(idsMotivo) {
  if (!idsMotivo || idsMotivo.length === 0) return true;
  const encontrados = await database("v2_motivo_restricao")
    .whereIn("id_motivo_restricao", idsMotivo)
    .andWhere("is_active", true)
    .select("id_motivo_restricao");
  return encontrados.length === idsMotivo.length;
}

// Normaliza um array vindo do body: aceita undefined/null, filtra valores
// vazios, converte pra número e remove duplicados.
function normalizarArrayIds(valor) {
  if (!Array.isArray(valor)) return [];
  return [...new Set(valor.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
}

// Valida a combinação tipo + modo_restricao + turnos, deixando claro pro
// admin quando a combinação não faz sentido (ex: mandar turnos sem modo,
// ou modo sem nenhum turno selecionado).
function validarCombinacaoRestricao(turnos, modo_restricao) {
  if (turnos.length > 0 && !MODOS_RESTRICAO.includes(modo_restricao)) {
    return { valido: false, msg: "Selecionar turno(s) exige informar o modo da restrição (SOMENTE ou EXCETO)." };
  }
  if (turnos.length === 0 && modo_restricao) {
    return { valido: false, msg: "Informar o modo da restrição exige selecionar ao menos um turno." };
  }
  return { valido: true };
}

// -----------------------------------------------------------------------
// GET /afastamentos/motivos
// -----------------------------------------------------------------------
async function listarMotivosRestricaoV2(req, res) {
  try {
    const motivos = await database("v2_motivo_restricao")
      .where({ is_active: true })
      .orderBy("descricao")
      .select("id_motivo_restricao", "descricao");
    return res.status(200).json(motivos);
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// -----------------------------------------------------------------------
// POST /afastamentos/motivos
// Admin cadastra um novo motivo em texto livre — passa a existir como
// opção selecionável dali pra frente (é o "select com múltipla escolha +
// adicionar novo texto" pedido pra Restrição Geral).
// -----------------------------------------------------------------------
async function criarMotivoRestricaoV2(req, res) {
  try {
    const descricao = limparEspaco(req.body.descricao || "");
    if (!descricao || descricao.length < 3) {
      return res.status(400).json({ msg: "Descrição do motivo deve ter ao menos 3 caracteres." });
    }

    const existente = await database("v2_motivo_restricao")
      .whereRaw("LOWER(descricao) = LOWER(?)", [descricao])
      .first();
    if (existente) {
      if (!existente.is_active) {
        await database("v2_motivo_restricao")
          .where({ id_motivo_restricao: existente.id_motivo_restricao })
          .update({ is_active: true, updated_at: new Date() });
      }
      return res.status(200).json({
        id_motivo_restricao: existente.id_motivo_restricao,
        descricao: existente.descricao,
        msg: "Motivo já existia — reaproveitado.",
      });
    }

    const [novo] = await database("v2_motivo_restricao")
      .insert({ descricao, is_active: true })
      .returning(["id_motivo_restricao", "descricao"]);

    return res.status(201).json(novo);
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// -----------------------------------------------------------------------
// GET /afastamentos
// Filtros opcionais via query: fk_id_usuario, tipo, ativo (true/false),
// busca (nome/matrícula/nome de guerra)
// -----------------------------------------------------------------------
async function listarAfastamentosV2(req, res) {
  try {
    const { fk_id_usuario, tipo, ativo, busca, vigente_em } = req.query;

    let vigenteEmValido = null;
    if (vigente_em) {
      const check = validarDataObrigatoria(vigente_em, "vigente_em");
      if (!check.valido) return res.status(400).json({ msg: check.msg });
      vigenteEmValido = check.data;
    }

    const query = database("v2_afastamentos")
      .join("users", "users.id_user", "v2_afastamentos.fk_id_usuario")
      .leftJoin("tbl_patentes", "tbl_patentes.id_patente", "users.id_patente")
      .select(
        "v2_afastamentos.id_afastamento",
        "v2_afastamentos.fk_id_usuario",
        "v2_afastamentos.tipo",
        "v2_afastamentos.modo_restricao",
        "v2_afastamentos.data_inicio",
        "v2_afastamentos.data_fim",
        "v2_afastamentos.bgo_referencia",
        "v2_afastamentos.observacao",
        "v2_afastamentos.ativo",
        "v2_afastamentos.created_at",
        "users.nome",
        "users.nome_guerra",
        "users.matricula",
        "tbl_patentes.sigla_patente",
      )
      .orderBy("v2_afastamentos.data_inicio", "desc");

    if (fk_id_usuario) query.andWhere("v2_afastamentos.fk_id_usuario", fk_id_usuario);
    if (tipo) query.andWhere("v2_afastamentos.tipo", tipo);
    if (ativo === "true") query.andWhere("v2_afastamentos.ativo", true);
    if (ativo === "false") query.andWhere("v2_afastamentos.ativo", false);
    // "vigente_em" é mais específico que "ativo": além da flag, exige que a
    // data caia dentro do período do afastamento — é a mesma fotografia de
    // um dia usada no resumo do efetivo (ver calcularResumoEfetivo).
    if (vigenteEmValido) {
      query
        .andWhere("v2_afastamentos.ativo", true)
        .andWhere("v2_afastamentos.data_inicio", "<=", vigenteEmValido)
        .andWhere(function () {
          this.whereNull("v2_afastamentos.data_fim").orWhere("v2_afastamentos.data_fim", ">=", vigenteEmValido);
        });
    }
    if (busca) {
      const termo = `%${busca.trim()}%`;
      query.andWhere(function () {
        this.whereILike("users.nome", termo)
          .orWhereILike("users.nome_guerra", termo)
          .orWhereILike("users.matricula", termo);
      });
    }

    const afastamentos = await query;

    if (afastamentos.length === 0) return res.status(200).json([]);

    const ids = afastamentos.map((a) => a.id_afastamento);
    const [turnos, grupamentos, motivos] = await Promise.all([
      database("v2_afastamento_turno")
        .join("v2_turno", "v2_turno.id_turno", "v2_afastamento_turno.fk_id_turno")
        .whereIn("fk_id_afastamento", ids)
        .select("fk_id_afastamento", "v2_turno.id_turno", "v2_turno.numero", "v2_turno.descricao"),
      database("v2_afastamento_grupamento")
        .join("v2_grupamento", "v2_grupamento.id_grupamento", "v2_afastamento_grupamento.fk_id_grupamento")
        .whereIn("fk_id_afastamento", ids)
        .select("fk_id_afastamento", "v2_grupamento.id_grupamento", "v2_grupamento.sigla"),
      database("v2_afastamento_motivo")
        .join(
          "v2_motivo_restricao",
          "v2_motivo_restricao.id_motivo_restricao",
          "v2_afastamento_motivo.fk_id_motivo_restricao",
        )
        .whereIn("fk_id_afastamento", ids)
        .select(
          "fk_id_afastamento",
          "v2_motivo_restricao.id_motivo_restricao",
          "v2_motivo_restricao.descricao",
        ),
    ]);

    const resultado = afastamentos.map((a) => ({
      ...a,
      turnos: turnos
        .filter((t) => t.fk_id_afastamento === a.id_afastamento)
        .map((t) => ({ id_turno: t.id_turno, numero: t.numero, descricao: t.descricao })),
      grupamentos: grupamentos
        .filter((g) => g.fk_id_afastamento === a.id_afastamento)
        .map((g) => ({ id_grupamento: g.id_grupamento, sigla: g.sigla })),
      motivos: motivos
        .filter((m) => m.fk_id_afastamento === a.id_afastamento)
        .map((m) => ({ id_motivo_restricao: m.id_motivo_restricao, descricao: m.descricao })),
    }));

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// -----------------------------------------------------------------------
// GET /afastamentos/:id
// -----------------------------------------------------------------------
async function obterAfastamentoV2(req, res) {
  try {
    const { id } = req.params;
    const afastamento = await database("v2_afastamentos").where({ id_afastamento: id }).first();
    if (!afastamento) {
      return res.status(404).json({ msg: "Afastamento não encontrado" });
    }

    const [turnos, grupamentos, motivos] = await Promise.all([
      database("v2_afastamento_turno").where({ fk_id_afastamento: id }).select("fk_id_turno"),
      database("v2_afastamento_grupamento").where({ fk_id_afastamento: id }).select("fk_id_grupamento"),
      database("v2_afastamento_motivo").where({ fk_id_afastamento: id }).select("fk_id_motivo_restricao"),
    ]);

    return res.status(200).json({
      ...afastamento,
      turnos: turnos.map((t) => t.fk_id_turno),
      grupamentos: grupamentos.map((g) => g.fk_id_grupamento),
      motivos: motivos.map((m) => m.fk_id_motivo_restricao),
    });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// -----------------------------------------------------------------------
// POST /afastamentos
// -----------------------------------------------------------------------
async function criarAfastamentoV2(req, res) {
  try {
    const idAdmin = req.user.id_admin;
    const {
      fk_id_usuario,
      tipo,
      modo_restricao,
      data_inicio,
      data_fim,
      bgo_referencia,
      observacao,
      turnos,
      grupamentos,
      motivos,
    } = req.body;

    if (!fk_id_usuario || !tipo || !data_inicio) {
      return res.status(400).json({ msg: "fk_id_usuario, tipo e data_inicio são obrigatórios" });
    }
    if (!VALORES_TIPOS_AFASTAMENTO.includes(tipo)) {
      return res.status(400).json({ msg: "Tipo de afastamento inválido" });
    }

    const usuarioValido = await validarUsuarioAtivo(fk_id_usuario);
    if (!usuarioValido) {
      return res.status(404).json({ msg: "Militar não encontrado ou inativo" });
    }

    const dataInicioValida = validarDataObrigatoria(data_inicio, "Data de início");
    if (!dataInicioValida.valido) return res.status(400).json({ msg: dataInicioValida.msg });

    let dataFimValida = null;
    if (data_fim) {
      const check = validarDataObrigatoria(data_fim, "Data de fim");
      if (!check.valido) return res.status(400).json({ msg: check.msg });
      dataFimValida = check.data;
      if (dataFimValida < dataInicioValida.data) {
        return res.status(400).json({ msg: "Data de fim não pode ser anterior à data de início" });
      }
    }

    const idsTurno = normalizarArrayIds(turnos);
    const idsGrupamento = normalizarArrayIds(grupamentos);
    const idsMotivo = normalizarArrayIds(motivos);

    const combinacao = validarCombinacaoRestricao(idsTurno, modo_restricao);
    if (!combinacao.valido) return res.status(400).json({ msg: combinacao.msg });

    if (!(await validarTurnosExistem(idsTurno))) {
      return res.status(404).json({ msg: "Um ou mais turnos informados não existem" });
    }
    if (!(await validarGrupamentosExistem(idsGrupamento))) {
      return res.status(404).json({ msg: "Um ou mais grupamentos informados não existem" });
    }
    if (!(await validarMotivosExistem(idsMotivo))) {
      return res.status(404).json({ msg: "Um ou mais motivos informados não existem" });
    }

    let idNovo;
    try {
      await database.transaction(async (trx) => {
        const [novo] = await trx("v2_afastamentos")
          .insert({
            fk_id_usuario,
            tipo,
            modo_restricao: idsTurno.length > 0 ? modo_restricao : null,
            data_inicio: dataInicioValida.data,
            data_fim: dataFimValida,
            bgo_referencia: bgo_referencia ? limparEspaco(bgo_referencia) : null,
            observacao: observacao ? limparEspaco(observacao) : null,
            fk_id_admin: idAdmin,
          })
          .returning(["id_afastamento"]);

        idNovo = novo.id_afastamento || novo;

        if (idsTurno.length > 0) {
          await trx("v2_afastamento_turno").insert(
            idsTurno.map((fk_id_turno) => ({ fk_id_afastamento: idNovo, fk_id_turno })),
          );
        }
        if (idsGrupamento.length > 0) {
          await trx("v2_afastamento_grupamento").insert(
            idsGrupamento.map((fk_id_grupamento) => ({ fk_id_afastamento: idNovo, fk_id_grupamento })),
          );
        }
        if (idsMotivo.length > 0) {
          await trx("v2_afastamento_motivo").insert(
            idsMotivo.map((fk_id_motivo_restricao) => ({ fk_id_afastamento: idNovo, fk_id_motivo_restricao })),
          );
        }
      });
    } catch (erroTransacao) {
      // Constraint de exclusão (mesmo militar + mesmo tipo + período
      // sobreposto) cai aqui — código 23P01 é "exclusion_violation".
      if (erroTransacao.code === "23P01") {
        return res.status(409).json({
          msg: "Já existe um afastamento ativo desse mesmo tipo para este militar, com período sobreposto.",
        });
      }
      throw erroTransacao;
    }

    return res.status(201).json({ msg: "Afastamento registrado com sucesso", id_afastamento: idNovo });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// -----------------------------------------------------------------------
// PUT /afastamentos/:id
// -----------------------------------------------------------------------
async function atualizarAfastamentoV2(req, res) {
  try {
    const { id } = req.params;
    const existente = await database("v2_afastamentos").where({ id_afastamento: id }).first();
    if (!existente) {
      return res.status(404).json({ msg: "Afastamento não encontrado" });
    }

    const {
      tipo,
      modo_restricao,
      data_inicio,
      data_fim,
      bgo_referencia,
      observacao,
      turnos,
      grupamentos,
      motivos,
      ativo,
    } = req.body;

    const tipoFinal = tipo || existente.tipo;
    if (!VALORES_TIPOS_AFASTAMENTO.includes(tipoFinal)) {
      return res.status(400).json({ msg: "Tipo de afastamento inválido" });
    }

    const dataInicioValida = validarDataObrigatoria(data_inicio || existente.data_inicio, "Data de início");
    if (!dataInicioValida.valido) return res.status(400).json({ msg: dataInicioValida.msg });

    let dataFimValida = null;
    const dataFimBruta = data_fim !== undefined ? data_fim : existente.data_fim;
    if (dataFimBruta) {
      const check = validarDataObrigatoria(dataFimBruta, "Data de fim");
      if (!check.valido) return res.status(400).json({ msg: check.msg });
      dataFimValida = check.data;
      if (dataFimValida < dataInicioValida.data) {
        return res.status(400).json({ msg: "Data de fim não pode ser anterior à data de início" });
      }
    }

    const idsTurno = normalizarArrayIds(turnos);
    const idsGrupamento = normalizarArrayIds(grupamentos);
    const idsMotivo = normalizarArrayIds(motivos);
    const modoFinal = idsTurno.length > 0 ? modo_restricao || existente.modo_restricao : null;

    const combinacao = validarCombinacaoRestricao(idsTurno, modoFinal);
    if (!combinacao.valido) return res.status(400).json({ msg: combinacao.msg });

    if (!(await validarTurnosExistem(idsTurno))) {
      return res.status(404).json({ msg: "Um ou mais turnos informados não existem" });
    }
    if (!(await validarGrupamentosExistem(idsGrupamento))) {
      return res.status(404).json({ msg: "Um ou mais grupamentos informados não existem" });
    }
    if (!(await validarMotivosExistem(idsMotivo))) {
      return res.status(404).json({ msg: "Um ou mais motivos informados não existem" });
    }

    try {
      await database.transaction(async (trx) => {
        await trx("v2_afastamentos")
          .where({ id_afastamento: id })
          .update({
            tipo: tipoFinal,
            modo_restricao: modoFinal,
            data_inicio: dataInicioValida.data,
            data_fim: dataFimValida,
            bgo_referencia: bgo_referencia !== undefined ? (bgo_referencia ? limparEspaco(bgo_referencia) : null) : existente.bgo_referencia,
            observacao: observacao !== undefined ? (observacao ? limparEspaco(observacao) : null) : existente.observacao,
            ativo: ativo !== undefined ? Boolean(ativo) : existente.ativo,
            updated_at: new Date(),
          });

        await trx("v2_afastamento_turno").where({ fk_id_afastamento: id }).del();
        await trx("v2_afastamento_grupamento").where({ fk_id_afastamento: id }).del();
        await trx("v2_afastamento_motivo").where({ fk_id_afastamento: id }).del();

        if (idsTurno.length > 0) {
          await trx("v2_afastamento_turno").insert(
            idsTurno.map((fk_id_turno) => ({ fk_id_afastamento: id, fk_id_turno })),
          );
        }
        if (idsGrupamento.length > 0) {
          await trx("v2_afastamento_grupamento").insert(
            idsGrupamento.map((fk_id_grupamento) => ({ fk_id_afastamento: id, fk_id_grupamento })),
          );
        }
        if (idsMotivo.length > 0) {
          await trx("v2_afastamento_motivo").insert(
            idsMotivo.map((fk_id_motivo_restricao) => ({ fk_id_afastamento: id, fk_id_motivo_restricao })),
          );
        }
      });
    } catch (erroTransacao) {
      if (erroTransacao.code === "23P01") {
        return res.status(409).json({
          msg: "Já existe um afastamento ativo desse mesmo tipo para este militar, com período sobreposto.",
        });
      }
      throw erroTransacao;
    }

    return res.status(200).json({ msg: "Afastamento atualizado com sucesso" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// -----------------------------------------------------------------------
// PATCH /afastamentos/:id/encerrar
// Encerramento manual (ex: militar voltou antes do previsto) — soft,
// mantém o histórico. Não é a mesma coisa que excluir.
// -----------------------------------------------------------------------
async function encerrarAfastamentoV2(req, res) {
  try {
    const { id } = req.params;
    const linhas = await database("v2_afastamentos")
      .where({ id_afastamento: id })
      .update({ ativo: false, updated_at: new Date() });

    if (linhas === 0) {
      return res.status(404).json({ msg: "Afastamento não encontrado" });
    }
    return res.status(200).json({ msg: "Afastamento encerrado" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// -----------------------------------------------------------------------
// DELETE /afastamentos/:id
// -----------------------------------------------------------------------
async function excluirAfastamentoV2(req, res) {
  try {
    const { id } = req.params;
    const linhas = await database("v2_afastamentos").where({ id_afastamento: id }).del();
    if (linhas === 0) {
      return res.status(404).json({ msg: "Afastamento não encontrado" });
    }
    return res.status(200).json({ msg: "Afastamento excluído" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// -----------------------------------------------------------------------
// GET /afastamentos/contagem-ativos — badge do dashboard
// -----------------------------------------------------------------------
async function contarAfastamentosAtivosV2(req, res) {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const [{ count }] = await database("v2_afastamentos")
      .where({ ativo: true })
      .andWhere("data_inicio", "<=", hoje)
      .andWhere(function () {
        this.whereNull("data_fim").orWhere("data_fim", ">=", hoje);
      })
      .count("* as count");
    return res.status(200).json({ ativos: Number(count) });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// -----------------------------------------------------------------------
// Núcleo do resumo do efetivo — usado tanto pela rota de resumo isolado
// quanto pelo boletim completo.
//
// IMPORTANTE: apesar do boletim cobrir um período (mês), o "Resumo do
// Efetivo" no documento real do COPOM/PMSE é uma FOTOGRAFIA de um único
// dia de referência (o último dia do período, quando o boletim é fechado)
// — não uma soma de tudo que aconteceu no mês inteiro. A prova: no
// documento fonte, "Efetivo em férias" contava 4 pessoas mesmo a seção de
// texto listando 6 nomes — as 2 que já tinham retornado antes do último
// dia do período não entram na contagem, embora apareçam na lista.
//
// Usar sobreposição de período inteiro (como antes) fazia "Efetivo em
// serviço noturno" convergir pro mesmo valor de "Efetivo de serviço",
// porque o ciclo de 6 dias faz todo mundo passar pelo 3º turno pelo menos
// uma vez ao longo de um mês inteiro — por isso parecia (e de fato era)
// um campo duplicado. Com a fotografia de um único dia, os dois números
// voltam a ser independentes.
async function calcularResumoEfetivo(data_referencia, fk_id_grupamento, turnosNoturnos) {
  // Efetivo de serviço: militares com vínculo de grupamento vigente NA
  // DATA DE REFERÊNCIA (mesma base do roster já usado na tela de escala).
  const queryEfetivoServico = database("v2_grupamento_usuario")
    .where("v2_grupamento_usuario.data_inicio", "<=", data_referencia)
    .andWhere(function () {
      this.whereNull("v2_grupamento_usuario.data_fim").orWhere(
        "v2_grupamento_usuario.data_fim",
        ">=",
        data_referencia,
      );
    })
    .modify((qb) => {
      if (fk_id_grupamento) qb.andWhere("v2_grupamento_usuario.fk_id_grupamento", fk_id_grupamento);
    })
    .countDistinct("v2_grupamento_usuario.fk_id_usuario as count");

  const contarPorTipo = async (tipos) => {
    const query = database("v2_afastamentos")
      .whereIn("tipo", tipos)
      .andWhere("ativo", true)
      .andWhere("v2_afastamentos.data_inicio", "<=", data_referencia)
      .andWhere(function () {
        this.whereNull("v2_afastamentos.data_fim").orWhere("v2_afastamentos.data_fim", ">=", data_referencia);
      })
      .countDistinct("fk_id_usuario as count");
    if (fk_id_grupamento) {
      query.andWhere(function () {
        this.whereNotExists(function () {
          this.select(1)
            .from("v2_afastamento_grupamento")
            .whereRaw("v2_afastamento_grupamento.fk_id_afastamento = v2_afastamentos.id_afastamento");
        }).orWhereExists(function () {
          this.select(1)
            .from("v2_afastamento_grupamento")
            .whereRaw("v2_afastamento_grupamento.fk_id_afastamento = v2_afastamentos.id_afastamento")
            .andWhere("v2_afastamento_grupamento.fk_id_grupamento", fk_id_grupamento);
        });
      });
    }
    const [{ count }] = await query;
    return Number(count);
  };

  // Efetivo em serviço noturno: quem está de fato na grade da escala nos
  // turnos considerados noturnos NA DATA DE REFERÊNCIA (não é sobre
  // afastamento, é sobre a própria escala). Turnos noturnos padrão: só o
  // 3º (23h-07h) — configurável, já que o 2º turno (15h-23h) também tem
  // uma parcela noturna e a organização pode preferir contar os dois.
  const queryNoturno = database("v2_escala")
    .join("v2_grupamento_usuario", "v2_grupamento_usuario.fk_id_grupamento", "v2_escala.fk_id_grupamento")
    .join("v2_turno", "v2_turno.id_turno", "v2_escala.fk_id_turno")
    .whereIn("v2_turno.numero", turnosNoturnos)
    .andWhere("v2_escala.data", data_referencia)
    .andWhere("v2_grupamento_usuario.data_inicio", "<=", data_referencia)
    .andWhere(function () {
      this.whereNull("v2_grupamento_usuario.data_fim").orWhere(
        "v2_grupamento_usuario.data_fim",
        ">=",
        data_referencia,
      );
    })
    .modify((qb) => {
      if (fk_id_grupamento) qb.andWhere("v2_escala.fk_id_grupamento", fk_id_grupamento);
    })
    .countDistinct("v2_grupamento_usuario.fk_id_usuario as count");

  const [
    [{ count: efetivoServico }],
    efetivoEscalaDiferenciada,
    [{ count: efetivoNoturno }],
    efetivoCurso,
    efetivoFerias,
    efetivoLicenca,
    efetivoReducaoCarga,
    efetivoAfastamento,
  ] = await Promise.all([
    queryEfetivoServico,
    contarPorTipo(["ESCALA_DIFERENCIADA"]),
    queryNoturno,
    contarPorTipo(["CURSO"]),
    contarPorTipo(["FERIAS", "FERIAS_LEI_109"]),
    contarPorTipo(["LICENCA_ESPECIAL"]),
    contarPorTipo(["REDUCAO_CARGA"]),
    contarPorTipo(["AFASTAMENTO"]),
  ]);

  const linhas = {
    efetivo_de_servico: Number(efetivoServico),
    efetivo_escala_diferenciada: efetivoEscalaDiferenciada,
    efetivo_servico_noturno: Number(efetivoNoturno),
    efetivo_curso: efetivoCurso,
    efetivo_ferias: efetivoFerias,
    efetivo_licenca_especial: efetivoLicenca,
    efetivo_reducao_carga: efetivoReducaoCarga,
    efetivo_afastamento: efetivoAfastamento,
  };
  linhas.total_efetivo = Object.values(linhas).reduce((soma, valor) => soma + valor, 0);
  return linhas;
}

// -----------------------------------------------------------------------
// POST /afastamentos/resumo
// -----------------------------------------------------------------------
async function gerarResumoEfetivoV2(req, res) {
  try {
    const { data_inicio, data_fim, data_referencia, fk_id_grupamento, turnos_noturnos } = req.body;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ msg: "data_inicio e data_fim são obrigatórios" });
    }
    const inicioValido = validarDataObrigatoria(data_inicio, "Data de início");
    if (!inicioValido.valido) return res.status(400).json({ msg: inicioValido.msg });
    const fimValido = validarDataObrigatoria(data_fim, "Data de fim");
    if (!fimValido.valido) return res.status(400).json({ msg: fimValido.msg });

    // O resumo é uma fotografia de UM dia (por padrão, o último dia do
    // período) — não uma soma do período inteiro. Ver comentário em
    // calcularResumoEfetivo.
    let dataReferenciaValida = fimValido.data;
    if (data_referencia) {
      const check = validarDataObrigatoria(data_referencia, "Data de referência");
      if (!check.valido) return res.status(400).json({ msg: check.msg });
      dataReferenciaValida = check.data;
    }

    const turnosNoturnos =
      Array.isArray(turnos_noturnos) && turnos_noturnos.length > 0 ? turnos_noturnos.map(Number) : [3];

    const resumo = await calcularResumoEfetivo(dataReferenciaValida, fk_id_grupamento || null, turnosNoturnos);

    return res.status(200).json({ ...resumo, data_referencia: dataReferenciaValida });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

// -----------------------------------------------------------------------
// POST /afastamentos/boletim
// Monta as seções de afastamento + resumo pro período. A grade/roster
// (que já existe hoje) fica por conta do frontend, reaproveitando
// /escalas/listar/periodo-estendido e /escalas/grupamento/:id/membros.
// -----------------------------------------------------------------------
async function gerarBoletimV2(req, res) {
  try {
    const { data_inicio, data_fim, data_referencia, fk_id_grupamento, turnos_noturnos } = req.body;
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ msg: "data_inicio e data_fim são obrigatórios" });
    }
    const inicioValido = validarDataObrigatoria(data_inicio, "Data de início");
    if (!inicioValido.valido) return res.status(400).json({ msg: inicioValido.msg });
    const fimValido = validarDataObrigatoria(data_fim, "Data de fim");
    if (!fimValido.valido) return res.status(400).json({ msg: fimValido.msg });

    let dataReferenciaValida = fimValido.data;
    if (data_referencia) {
      const check = validarDataObrigatoria(data_referencia, "Data de referência");
      if (!check.valido) return res.status(400).json({ msg: check.msg });
      dataReferenciaValida = check.data;
    }

    const query = database("v2_afastamentos")
      .join("users", "users.id_user", "v2_afastamentos.fk_id_usuario")
      .leftJoin("tbl_patentes", "tbl_patentes.id_patente", "users.id_patente")
      .where("v2_afastamentos.ativo", true)
      .andWhere("v2_afastamentos.data_inicio", "<=", fimValido.data)
      .andWhere(function () {
        this.whereNull("v2_afastamentos.data_fim").orWhere("v2_afastamentos.data_fim", ">=", inicioValido.data);
      })
      .select(
        "v2_afastamentos.id_afastamento",
        "v2_afastamentos.tipo",
        "v2_afastamentos.modo_restricao",
        "v2_afastamentos.data_inicio",
        "v2_afastamentos.data_fim",
        "v2_afastamentos.bgo_referencia",
        "v2_afastamentos.observacao",
        "users.nome",
        "users.nome_guerra",
        "users.matricula",
        "tbl_patentes.sigla_patente",
      )
      .orderBy("users.nome");

    const afastamentos = await query;
    const ids = afastamentos.map((a) => a.id_afastamento);

    const [turnos, grupamentos, motivos] = ids.length
      ? await Promise.all([
          database("v2_afastamento_turno")
            .join("v2_turno", "v2_turno.id_turno", "v2_afastamento_turno.fk_id_turno")
            .whereIn("fk_id_afastamento", ids)
            .select("fk_id_afastamento", "v2_turno.numero"),
          database("v2_afastamento_grupamento")
            .join("v2_grupamento", "v2_grupamento.id_grupamento", "v2_afastamento_grupamento.fk_id_grupamento")
            .whereIn("fk_id_afastamento", ids)
            .select("fk_id_afastamento", "v2_grupamento.sigla"),
          database("v2_afastamento_motivo")
            .join(
              "v2_motivo_restricao",
              "v2_motivo_restricao.id_motivo_restricao",
              "v2_afastamento_motivo.fk_id_motivo_restricao",
            )
            .whereIn("fk_id_afastamento", ids)
            .select("fk_id_afastamento", "v2_motivo_restricao.descricao"),
        ])
      : [[], [], []];

    const detalhado = afastamentos.map((a) => ({
      ...a,
      turnos: turnos.filter((t) => t.fk_id_afastamento === a.id_afastamento).map((t) => t.numero),
      grupamentos: grupamentos.filter((g) => g.fk_id_afastamento === a.id_afastamento).map((g) => g.sigla),
      motivos: motivos.filter((m) => m.fk_id_afastamento === a.id_afastamento).map((m) => m.descricao),
    }));

    const secoes = VALORES_TIPOS_AFASTAMENTO.reduce((acc, tipo) => {
      acc[tipo] = detalhado.filter((a) => a.tipo === tipo);
      return acc;
    }, {});

    const turnosNoturnos =
      Array.isArray(turnos_noturnos) && turnos_noturnos.length > 0 ? turnos_noturnos.map(Number) : [3];
    const resumo = await calcularResumoEfetivo(dataReferenciaValida, fk_id_grupamento || null, turnosNoturnos);

    return res.status(200).json({
      periodo: { data_inicio: inicioValido.data, data_fim: fimValido.data },
      data_referencia: dataReferenciaValida,
      secoes,
      resumo,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
  }
}

module.exports = {
  listarMotivosRestricaoV2,
  criarMotivoRestricaoV2,
  listarAfastamentosV2,
  obterAfastamentoV2,
  criarAfastamentoV2,
  atualizarAfastamentoV2,
  encerrarAfastamentoV2,
  excluirAfastamentoV2,
  contarAfastamentosAtivosV2,
  gerarResumoEfetivoV2,
  gerarBoletimV2,
};
