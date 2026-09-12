const database = require("../database/db");
const jwt = require("jsonwebtoken");
const limparEspaco = require("../functions/limparEspacos");
const formatarDataEscala = require("../functions/formatarDataEscala");
const validarDataUsuario = require("../functions/validarDataUsuario");
const validarPeriodoEscala = require("../functions/validarPeriodoEscala");
const processarDiaMes = require("../functions/filtroDiaMes");
const calcularPeriodoEstendido = require("../functions/calcularPeriodoEstendido");
const {
  avaliarRestricoesAtivas,
  buscarAfastamentosAtivosPorUsuarios,
} = require("../functions/validarAlocacaoAfastamento");

// -----------------------------------------------------------------------
// 1) GERAR ESCALA A PARTIR DO CICLO (equivalente ao "createEscala", mas em
//    massa: cria N dias de uma vez, chamando a função fn_v2_gerar_escala
//    que já existe no banco)
// -----------------------------------------------------------------------
async function gerarEscalaV2(req, res) {
  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, process.env.SECRET_ADMIN, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "Token inválido ou expirado" });
    }

    // Tudo dentro de um try/catch (no controller original o corpo do
    // createEscala não tinha isso, e um erro assíncrono dentro do
    // jwt.verify vira um "unhandled rejection" silencioso).
    try {
      const dataInicio = validarDataUsuario(
        formatarDataEscala(req.body.data_inicio),
      );
      const dataFim = validarDataUsuario(formatarDataEscala(req.body.data_fim));

      if (!dataInicio.valido) {
        return res.status(400).json({ msg: dataInicio.motivo });
      }
      if (!dataFim.valido) {
        return res.status(400).json({ msg: dataFim.motivo });
      }

      const periodoValido = validarPeriodoEscala(
        dataInicio.objetoDate,
        dataFim.objetoDate,
      );
      if (!periodoValido.valido) {
        return res.status(400).json({ msg: periodoValido.motivo });
      }

      await database.raw("SELECT fn_v2_gerar_escala(?, ?)", [
        dataInicio.objetoDate,
        dataFim.objetoDate,
      ]);

      return res.status(201).json({
        msg: "Escala gerada com sucesso a partir do ciclo",
        data_inicio: dataInicio.objetoDate,
        data_fim: dataFim.objetoDate,
      });
    } catch (error) {
      return res.status(500).json({
        msg: "Erro interno do servidor",
        error: error.message,
      });
    }
  });
}

// -----------------------------------------------------------------------
// 2) CRIAR AJUSTE MANUAL (troca pontual de grupamento em um dia/turno
//    específico, sem mexer na regra do ciclo)
// -----------------------------------------------------------------------
async function criarAjusteManualV2(req, res) {
  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, process.env.SECRET_ADMIN, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "Token inválido ou expirado" });
    }

    try {
      const observacao = limparEspaco(req.body.observacao || "");

      if (!req.body.data || !req.body.fk_id_turno || !req.body.fk_id_grupamento) {
        return res.status(400).json({
          msg: "data, fk_id_turno e fk_id_grupamento são obrigatórios",
        });
      }

      const dataAjuste = validarDataUsuario(formatarDataEscala(req.body.data));
      if (!dataAjuste.valido) {
        return res.status(400).json({ msg: dataAjuste.motivo });
      }

      // O controller original não validava se fk_id_setor/fk_id_admin existiam
      // antes do insert (deixava o Postgres estourar o erro de FK). Aqui eu
      // validei turno e grupamento antes, pra devolver um 404 amigável.
      const turnoExiste = await database("v2_turno")
        .where({ id_turno: req.body.fk_id_turno, is_active: true })
        .first();
      if (!turnoExiste) {
        return res.status(404).json({ msg: "Turno não encontrado" });
      }

      const grupamentoExiste = await database("v2_grupamento")
        .where({ id_grupamento: req.body.fk_id_grupamento, is_active: true })
        .first();
      if (!grupamentoExiste) {
        return res.status(404).json({ msg: "Grupamento não encontrado" });
      }

      // v2_escala tem UNIQUE(data, fk_id_turno) -> se já existir, sobrescreve
      // como ajuste manual em vez de dar erro de duplicidade.
      await database("v2_escala")
        .insert({
          data: dataAjuste.objetoDate,
          fk_id_turno: req.body.fk_id_turno,
          fk_id_grupamento: req.body.fk_id_grupamento,
          origem: "AJUSTE_MANUAL",
          observacao: observacao || "Ajuste manual sem observação",
          created_at: new Date(),
          updated_at: new Date(),
        })
        .onConflict(["data", "fk_id_turno"])
        .merge({
          fk_id_grupamento: req.body.fk_id_grupamento,
          origem: "AJUSTE_MANUAL",
          observacao: observacao || "Ajuste manual sem observação",
          updated_at: new Date(),
        });

      return res.status(201).json({ msg: "Ajuste manual registrado com sucesso" });
    } catch (error) {
      return res.status(500).json({
        msg: "Erro interno do servidor",
        error: error.message,
      });
    }
  });
}

// -----------------------------------------------------------------------
// 3) LISTAR ESCALAS (equivalente ao "listarEscalaGuarnicoes": por mês, por
//    data ou por dia)
// -----------------------------------------------------------------------
async function listarEscalasV2(req, res) {
  if (!req?.body) {
    return res.status(400).json({ msg: "Solicitação inválida ou ausente" });
  }

  if (!req.body?.value || req.body.value === "") {
    return res.status(400).json({ msg: "Valor inválido ou ausente" });
  }

  const { value, fk_id_grupamento } = req.body;

  // por mes
  if (value === "mes") {
    if (!req.body?.entrada || req.body.entrada === "") {
      return res.status(400).json({ msg: "Data inválida ou ausente" });
    }

    try {
      const { startDate, endDate } = processarDiaMes(req.body.entrada);

      const query = database("v2_escala")
        .select(
          "v2_escala.id_escala",
          "v2_escala.data",
          "v2_escala.origem",
          "v2_escala.observacao",
          "v2_turno.numero AS turno",
          "v2_turno.hora_inicio",
          "v2_turno.hora_fim",
          "v2_grupamento.id_grupamento",
          "v2_grupamento.sigla AS grupamento",
        )
        .join("v2_turno", "v2_turno.id_turno", "v2_escala.fk_id_turno")
        .join(
          "v2_grupamento",
          "v2_grupamento.id_grupamento",
          "v2_escala.fk_id_grupamento",
        )
        .whereBetween("v2_escala.data", [startDate, endDate])
        .orderBy(["v2_escala.data", "v2_turno.numero"]);

      // Filtro opcional por grupamento. No controller original o "id" filtrava
      // por tbl_escala.id_escala (o cabeçalho da escala). Aqui não existe mais
      // um cabeçalho — cada linha de v2_escala já é o próprio registro — então
      // reaproveitei o campo pra filtrar por grupamento, que é o que faz
      // sentido nesse modelo.
      if (fk_id_grupamento) {
        query.andWhere("v2_escala.fk_id_grupamento", fk_id_grupamento);
      }

      const data = await query;

      if (data.length <= 0) {
        return res.status(404).json({ msg: "Nenhuma escala encontrada" });
      }

      const arrayDados = data.map((element) => ({
        id_escala: element.id_escala,
        data: element.data || "01/01/2000",
        turno: element.turno || 1,
        hora_inicio: element.hora_inicio || "00:00",
        hora_fim: element.hora_fim || "00:00",
        id_grupamento: element.id_grupamento || null,
        grupamento: element.grupamento || "Nenhum grupamento cadastrado",
        origem: element.origem || "CICLO",
        observacao: element.observacao || "Sem observação",
      }));

      return res.status(200).json(arrayDados);
    } catch (error) {
      return res.status(500).json({ msg: "Erro do servidor!" });
    }
  }

  // por data (implementado aqui; no controller original era só um stub)
  if (value === "data") {
    if (!req.body?.entrada || req.body.entrada === "") {
      return res.status(400).json({ msg: "Data inválida ou ausente" });
    }

    try {
      const dataConsulta = validarDataUsuario(
        formatarDataEscala(req.body.entrada),
      );
      if (!dataConsulta.valido) {
        return res.status(400).json({ msg: dataConsulta.motivo });
      }

      const data = await database("v2_escala")
        .select(
          "v2_escala.id_escala",
          "v2_escala.data",
          "v2_escala.origem",
          "v2_turno.numero AS turno",
          "v2_grupamento.id_grupamento",
          "v2_grupamento.sigla AS grupamento",
        )
        .join("v2_turno", "v2_turno.id_turno", "v2_escala.fk_id_turno")
        .join(
          "v2_grupamento",
          "v2_grupamento.id_grupamento",
          "v2_escala.fk_id_grupamento",
        )
        .where("v2_escala.data", dataConsulta.objetoDate)
        .orderBy("v2_turno.numero");

      if (data.length <= 0) {
        return res
          .status(404)
          .json({ msg: "Nenhuma escala encontrada para essa data" });
      }

      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ msg: "Erro do servidor!" });
    }
  }

  // por dia (o controller original também deixava isso como stub, sem
  // definir a regra de negócio — mantive assim aqui pelo mesmo motivo)
  if (value === "dia") {
    return res
      .status(200)
      .json({ msg: "Filtro por dia da semana ainda não implementado" });
  }

  return res.status(400).json({ msg: "Valor de filtro desconhecido" });
}

// -----------------------------------------------------------------------
// 4) BUSCAR ESCALA POR ID
// -----------------------------------------------------------------------
async function getEscalaV2ById(req, res) {
  const { id } = req.params;

  try {
    const escala = await database("v2_escala")
      .select(
        "v2_escala.id_escala",
        "v2_escala.data",
        "v2_escala.origem",
        "v2_escala.observacao",
        "v2_turno.numero AS turno",
        "v2_grupamento.sigla AS grupamento",
      )
      .join("v2_turno", "v2_turno.id_turno", "v2_escala.fk_id_turno")
      .join(
        "v2_grupamento",
        "v2_grupamento.id_grupamento",
        "v2_escala.fk_id_grupamento",
      )
      .where({ "v2_escala.id_escala": id })
      .first();

    if (escala) {
      return res.status(200).json(escala);
    }
    return res.status(404).json({ msg: "Escala não encontrada" });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Erro interno do servidor"});
  }
}

// -----------------------------------------------------------------------
// 5) "REVERTER PARA O CICLO" (faz o papel do "deleteEscala", mas sem
//    apagar a linha - ver explicação de por que isso mudou no texto de
//    acompanhamento)
// -----------------------------------------------------------------------
async function reverterParaCicloV2(req, res) {
  const { id } = req.params;

  try {
    const escalaExiste = await database("v2_escala")
      .where({ id_escala: id })
      .first();

    if (!escalaExiste) {
      return res.status(404).json({ msg: "Escala não encontrada" });
    }

    const resultadoDia = await database.raw(
      "SELECT fn_v2_dia_ciclo(?) AS dia_ciclo",
      [escalaExiste.data],
    );
    const dia_ciclo = resultadoDia.rows[0].dia_ciclo;

    const regraCiclo = await database("v2_ciclo_escala")
      .where({ dia_ciclo, fk_id_turno: escalaExiste.fk_id_turno })
      .first();

    if (!regraCiclo) {
      return res.status(500).json({
        msg: "Não foi possível localizar a regra do ciclo para essa data/turno",
      });
    }

    await database("v2_escala")
      .where({ id_escala: id })
      .update({
        fk_id_grupamento: regraCiclo.fk_id_grupamento,
        origem: "CICLO",
        observacao: null,
        updated_at: new Date(),
      });

    return res
      .status(200)
      .json({ msg: "Escala revertida para o grupamento do ciclo com sucesso!" });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Erro interno do servidor"});
  }
}

// -----------------------------------------------------------------------
// 6) VINCULAR USUÁRIO A UM GRUPAMENTO (equivalente funcional ao
//    "create_guarnicao", que no seu arquivo original estava apenas com
//    um stub retornando 203)
// -----------------------------------------------------------------------
async function vincularUsuarioGrupamentoV2(req, res) {
  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, process.env.SECRET_ADMIN, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "Token inválido ou expirado" });
    }

    try {
      const { fk_id_usuario, fk_id_grupamento, data_inicio } = req.body;

      if (!fk_id_usuario || !fk_id_grupamento || !data_inicio) {
        return res.status(400).json({
          msg: "fk_id_usuario, fk_id_grupamento e data_inicio são obrigatórios",
        });
      }

      const inicio = validarDataUsuario(formatarDataEscala(data_inicio));
      if (!inicio.valido) {
        return res.status(400).json({ msg: inicio.motivo });
      }

      // O banco já impede (via EXCLUDE USING gist) que o mesmo usuário tenha
      // dois vínculos com datas sobrepostas. Fazemos essa checagem aqui antes
      // só pra devolver uma mensagem amigável em vez do erro cru do Postgres.
      const vinculoAberto = await database("v2_grupamento_usuario")
        .where({ fk_id_usuario })
        .whereNull("data_fim")
        .first();

      if (vinculoAberto) {
        return res.status(409).json({
          msg: "Usuário já possui vínculo ativo em um grupamento. Encerre-o antes de criar um novo.",
        });
      }

      await database("v2_grupamento_usuario").insert({
        fk_id_usuario,
        fk_id_grupamento,
        data_inicio: inicio.objetoDate,
        data_fim: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return res
        .status(201)
        .json({ msg: "Usuário vinculado ao grupamento com sucesso!" });
    } catch (error) {
      return res.status(500).json({
        msg: "Erro interno do servidor",
        error: error.message,
      });
    }
  });
}

// -----------------------------------------------------------------------
// 7) ENCERRAR VÍNCULO (equivalente a um "soft delete", igual ao is_active
//    das suas outras tabelas, só que usando data_fim em vez de boolean)
// -----------------------------------------------------------------------
async function desvincularUsuarioGrupamentoV2(req, res) {
  const { id } = req.params; // id_grupamento_usuario

  try {
    const vinculo = await database("v2_grupamento_usuario")
      .where({ id_grupamento_usuario: id })
      .first();

    if (!vinculo) {
      return res.status(404).json({ msg: "Vínculo não encontrado" });
    }

    if (vinculo.data_fim) {
      return res
        .status(409)
        .json({ msg: "Esse vínculo já foi encerrado anteriormente" });
    }

    await database("v2_grupamento_usuario")
      .where({ id_grupamento_usuario: id })
      .update({ data_fim: new Date(), updated_at: new Date() });

    return res.status(200).json({ msg: "Vínculo encerrado com sucesso!" });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Erro interno do servidor"});
  }
}

// -----------------------------------------------------------------------
// 8) LISTAR PERÍODO ESTENDIDO (os últimos N dias do mês anterior + o mês
//    de referência inteiro — ex: 27/06/2026 a 31/07/2026 pedindo "07/2026").
//    Útil pra tela de calendário que mostra o "resto" da semana anterior
//    junto com o mês corrente, igual a maioria dos calendários visuais.
// -----------------------------------------------------------------------
async function listarEscalaPeriodoEstendidoV2(req, res) {
  if (!req?.body?.mes_referencia) {
    return res.status(400).json({
      msg: 'mes_referencia é obrigatório, no formato "MM/YYYY" (ex: "07/2026")',
    });
  }

  try {
    const diasMesAnterior = req.body.dias_mes_anterior || 4;

    const { data_inicio, data_fim } = calcularPeriodoEstendido(
      req.body.mes_referencia,
      diasMesAnterior,
    );

    const query = database("v2_escala")
      .select(
        "v2_escala.id_escala",
        "v2_escala.data",
        "v2_escala.origem",
        "v2_escala.observacao",
        "v2_turno.numero AS turno",
        "v2_turno.hora_inicio",
        "v2_turno.hora_fim",
        "v2_grupamento.id_grupamento",
        "v2_grupamento.sigla AS grupamento",
      )
      .join("v2_turno", "v2_turno.id_turno", "v2_escala.fk_id_turno")
      .join(
        "v2_grupamento",
        "v2_grupamento.id_grupamento",
        "v2_escala.fk_id_grupamento",
      )
      .whereBetween("v2_escala.data", [data_inicio, data_fim])
      .orderBy(["v2_escala.data", "v2_turno.numero"]);

    if (req.body.fk_id_grupamento) {
      query.andWhere("v2_escala.fk_id_grupamento", req.body.fk_id_grupamento);
    }

    const data = await query;

    if (data.length <= 0) {
      // Devolve o período calculado mesmo vazio — o frontend usa isso pra
      // oferecer "gerar automaticamente" sem precisar recalcular a mesma
      // conta de dias no client.
      return res.status(404).json({
        msg: "Nenhuma escala encontrada nesse período. Rode fn_v2_gerar_escala pro intervalo antes de consultar.",
        periodo: { data_inicio, data_fim },
      });
    }

    const arrayDados = data.map((element) => ({
      id_escala: element.id_escala,
      data: element.data || "01/01/2000",
      turno: element.turno || 1,
      hora_inicio: element.hora_inicio || "00:00",
      hora_fim: element.hora_fim || "00:00",
      id_grupamento: element.id_grupamento || null,
      grupamento: element.grupamento || "Nenhum grupamento cadastrado",
      origem: element.origem || "CICLO",
      observacao: element.observacao || "Sem observação",
    }));

    return res.status(200).json({
      periodo: { data_inicio, data_fim },
      total_registros: arrayDados.length,
      escalas: arrayDados,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Erro interno do servidor",
      error: error.message,
    });
  }
}

// -----------------------------------------------------------------------
// 9) LISTAR MEMBROS ATIVOS DE UM GRUPAMENTO (vínculo aberto, sem data_fim)
//    Usado pela tela de escala pra mostrar quem já está escalado antes de
//    permitir adicionar/remover militares daquele grupamento.
// -----------------------------------------------------------------------
async function listarMembrosGrupamentoV2(req, res) {
  const { id } = req.params; // id_grupamento

  try {
    const membros = await database("v2_grupamento_usuario")
      .select(
        "v2_grupamento_usuario.id_grupamento_usuario",
        "v2_grupamento_usuario.data_inicio",
        "users.id_user",
        "users.nome",
        "users.nome_guerra",
        "users.matricula",
        "users.cpf",
        "tbl_patentes.sigla_patente",
      )
      .join("users", "users.id_user", "v2_grupamento_usuario.fk_id_usuario")
      .leftJoin("tbl_patentes", "tbl_patentes.id_patente", "users.id_patente")
      .where({ "v2_grupamento_usuario.fk_id_grupamento": id })
      .whereNull("v2_grupamento_usuario.data_fim")
      .orderBy("users.nome");

    // Anota, sem bloquear nada, quais membros têm afastamento/restrição
    // ativo hoje — vira o aviso visual no card do grupamento na tela de
    // escala (módulo de Afastamentos é 100% informativo).
    const hoje = new Date().toISOString().slice(0, 10);
    const afastamentosPorUsuario = await buscarAfastamentosAtivosPorUsuarios(
      membros.map((m) => m.id_user),
      hoje,
    );
    const membrosComAviso = membros.map((m) => ({
      ...m,
      afastamentos_ativos: afastamentosPorUsuario.get(m.id_user) || [],
    }));

    return res.status(200).json(membrosComAviso);
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// -----------------------------------------------------------------------
// Helpers internos (não exportados) — validação compartilhada pelas 3
// funções de criação de substituição abaixo. Mesmo padrão de
// "valida e devolve 404 amigável" já usado em criarAjusteManualV2.
// -----------------------------------------------------------------------
async function validarTurnoEGrupamento(fk_id_turno, fk_id_grupamento) {
  const turnoExiste = await database("v2_turno")
    .where({ id_turno: fk_id_turno, is_active: true })
    .first();
  if (!turnoExiste) {
    return { valido: false, msg: "Turno não encontrado" };
  }

  const grupamentoExiste = await database("v2_grupamento")
    .where({ id_grupamento: fk_id_grupamento, is_active: true })
    .first();
  if (!grupamentoExiste) {
    return { valido: false, msg: "Grupamento não encontrado" };
  }

  return { valido: true };
}

async function validarUsuarioExiste(id_user, rotulo) {
  const usuario = await database("users")
    .where({ id_user, is_active: true })
    .first();
  if (!usuario) {
    return { valido: false, msg: `${rotulo} não encontrado ou inativo` };
  }
  return { valido: true };
}

// Impede empilhar duas exceções contraditórias pro mesmo militar no mesmo
// data+turno (ex: adicionar o mesmo cara duas vezes, ou excluir quem já
// tem exclusão registrada ali).
async function existeSubstituicaoParaUsuario(data, fk_id_turno, id_user) {
  return database("v2_escala_substituicao")
    .where({ data, fk_id_turno })
    .andWhere(function () {
      this.where({ fk_id_usuario_sai: id_user }).orWhere({
        fk_id_usuario_entra: id_user,
      });
    })
    .first();
}

// -----------------------------------------------------------------------
// 10) SUBSTITUIÇÃO PONTUAL — ADIÇÃO (militar extra só naquele dia+turno,
//     sem mexer no vínculo mensal dele em nenhum grupamento)
// -----------------------------------------------------------------------
async function criarSubstituicaoAdicaoV2(req, res) {
  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, process.env.SECRET_ADMIN, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "Token inválido ou expirado" });
    }

    try {
      const { fk_id_turno, fk_id_grupamento, fk_id_usuario_entra, observacao } =
        req.body;

      if (!req.body.data || !fk_id_turno || !fk_id_grupamento || !fk_id_usuario_entra) {
        return res.status(400).json({
          msg: "data, fk_id_turno, fk_id_grupamento e fk_id_usuario_entra são obrigatórios",
        });
      }

      const dataSubstituicao = validarDataUsuario(formatarDataEscala(req.body.data));
      if (!dataSubstituicao.valido) {
        return res.status(400).json({ msg: dataSubstituicao.motivo });
      }

      const validacao = await validarTurnoEGrupamento(fk_id_turno, fk_id_grupamento);
      if (!validacao.valido) {
        return res.status(404).json({ msg: validacao.msg });
      }

      const usuarioValido = await validarUsuarioExiste(fk_id_usuario_entra, "Militar");
      if (!usuarioValido.valido) {
        return res.status(404).json({ msg: usuarioValido.msg });
      }

      const jaExiste = await existeSubstituicaoParaUsuario(
        dataSubstituicao.objetoDate,
        fk_id_turno,
        fk_id_usuario_entra,
      );
      if (jaExiste) {
        return res.status(409).json({
          msg: "Já existe uma substituição registrada pra esse militar nesse dia/turno. Reverta a existente antes de criar outra.",
        });
      }

      await database("v2_escala_substituicao").insert({
        data: dataSubstituicao.objetoDate,
        fk_id_turno,
        fk_id_grupamento,
        fk_id_usuario_sai: null,
        fk_id_usuario_entra,
        tipo: "ADICAO",
        observacao: limparEspaco(observacao || "") || null,
        fk_id_admin: decoded.id_admin || null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const avisos = await avaliarRestricoesAtivas(
        fk_id_usuario_entra,
        dataSubstituicao.dataFormatada,
        fk_id_turno,
        fk_id_grupamento,
      );

      return res.status(201).json({
        msg: "Militar adicionado à escala apenas nesse dia com sucesso!",
        avisos,
      });
    } catch (error) {
      return res.status(500).json({
        msg: "Erro interno do servidor",
        error: error.message,
      });
    }
  });
}

// -----------------------------------------------------------------------
// 11) SUBSTITUIÇÃO PONTUAL — EXCLUSÃO (militar de folga só naquele
//     dia+turno, sem mexer no vínculo mensal)
// -----------------------------------------------------------------------
async function criarSubstituicaoExclusaoV2(req, res) {
  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, process.env.SECRET_ADMIN, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "Token inválido ou expirado" });
    }

    try {
      const { fk_id_turno, fk_id_grupamento, fk_id_usuario_sai, observacao } = req.body;

      if (!req.body.data || !fk_id_turno || !fk_id_grupamento || !fk_id_usuario_sai) {
        return res.status(400).json({
          msg: "data, fk_id_turno, fk_id_grupamento e fk_id_usuario_sai são obrigatórios",
        });
      }

      const dataSubstituicao = validarDataUsuario(formatarDataEscala(req.body.data));
      if (!dataSubstituicao.valido) {
        return res.status(400).json({ msg: dataSubstituicao.motivo });
      }

      const validacao = await validarTurnoEGrupamento(fk_id_turno, fk_id_grupamento);
      if (!validacao.valido) {
        return res.status(404).json({ msg: validacao.msg });
      }

      const usuarioValido = await validarUsuarioExiste(fk_id_usuario_sai, "Militar");
      if (!usuarioValido.valido) {
        return res.status(404).json({ msg: usuarioValido.msg });
      }

      const jaExiste = await existeSubstituicaoParaUsuario(
        dataSubstituicao.objetoDate,
        fk_id_turno,
        fk_id_usuario_sai,
      );
      if (jaExiste) {
        return res.status(409).json({
          msg: "Já existe uma substituição registrada pra esse militar nesse dia/turno. Reverta a existente antes de criar outra.",
        });
      }

      await database("v2_escala_substituicao").insert({
        data: dataSubstituicao.objetoDate,
        fk_id_turno,
        fk_id_grupamento,
        fk_id_usuario_sai,
        fk_id_usuario_entra: null,
        tipo: "EXCLUSAO",
        observacao: limparEspaco(observacao || "") || null,
        fk_id_admin: decoded.id_admin || null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return res
        .status(201)
        .json({ msg: "Militar excluído da escala apenas nesse dia com sucesso!" });
    } catch (error) {
      return res.status(500).json({
        msg: "Erro interno do servidor",
        error: error.message,
      });
    }
  });
}

// -----------------------------------------------------------------------
// 12) SUBSTITUIÇÃO PONTUAL — PERMUTA (troca entre dois militares só
//     naquele dia+turno, sem mexer no vínculo mensal de nenhum dos dois)
// -----------------------------------------------------------------------
async function criarSubstituicaoPermutaV2(req, res) {
  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, process.env.SECRET_ADMIN, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "Token inválido ou expirado" });
    }

    try {
      const { fk_id_turno, fk_id_grupamento, fk_id_usuario_sai, fk_id_usuario_entra, observacao } =
        req.body;

      if (
        !req.body.data ||
        !fk_id_turno ||
        !fk_id_grupamento ||
        !fk_id_usuario_sai ||
        !fk_id_usuario_entra
      ) {
        return res.status(400).json({
          msg: "data, fk_id_turno, fk_id_grupamento, fk_id_usuario_sai e fk_id_usuario_entra são obrigatórios",
        });
      }

      if (fk_id_usuario_sai === fk_id_usuario_entra) {
        return res
          .status(400)
          .json({ msg: "fk_id_usuario_sai e fk_id_usuario_entra não podem ser o mesmo militar" });
      }

      const dataSubstituicao = validarDataUsuario(formatarDataEscala(req.body.data));
      if (!dataSubstituicao.valido) {
        return res.status(400).json({ msg: dataSubstituicao.motivo });
      }

      const validacao = await validarTurnoEGrupamento(fk_id_turno, fk_id_grupamento);
      if (!validacao.valido) {
        return res.status(404).json({ msg: validacao.msg });
      }

      const saiValido = await validarUsuarioExiste(fk_id_usuario_sai, "Militar que sai");
      if (!saiValido.valido) {
        return res.status(404).json({ msg: saiValido.msg });
      }

      const entraValido = await validarUsuarioExiste(fk_id_usuario_entra, "Militar que entra");
      if (!entraValido.valido) {
        return res.status(404).json({ msg: entraValido.msg });
      }

      const conflitoSai = await existeSubstituicaoParaUsuario(
        dataSubstituicao.objetoDate,
        fk_id_turno,
        fk_id_usuario_sai,
      );
      const conflitoEntra = await existeSubstituicaoParaUsuario(
        dataSubstituicao.objetoDate,
        fk_id_turno,
        fk_id_usuario_entra,
      );
      if (conflitoSai || conflitoEntra) {
        return res.status(409).json({
          msg: "Um dos dois militares já tem substituição registrada nesse dia/turno. Reverta a existente antes de criar outra.",
        });
      }

      await database("v2_escala_substituicao").insert({
        data: dataSubstituicao.objetoDate,
        fk_id_turno,
        fk_id_grupamento,
        fk_id_usuario_sai,
        fk_id_usuario_entra,
        tipo: "PERMUTA",
        observacao: limparEspaco(observacao || "") || null,
        fk_id_admin: decoded.id_admin || null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const avisos = await avaliarRestricoesAtivas(
        fk_id_usuario_entra,
        dataSubstituicao.dataFormatada,
        fk_id_turno,
        fk_id_grupamento,
      );

      return res.status(201).json({
        msg: "Permuta registrada com sucesso apenas para esse dia!",
        avisos,
      });
    } catch (error) {
      return res.status(500).json({
        msg: "Erro interno do servidor",
        error: error.message,
      });
    }
  });
}

// -----------------------------------------------------------------------
// 13) LISTAR SUBSTITUIÇÕES DE UM DIA (todas as exceções pontuais
//     registradas pra uma data, com nome dos militares envolvidos)
// -----------------------------------------------------------------------
async function listarSubstituicoesDoDiaV2(req, res) {
  const { data } = req.params;

  try {
    const dataConsulta = validarDataUsuario(formatarDataEscala(data));
    if (!dataConsulta.valido) {
      return res.status(400).json({ msg: dataConsulta.motivo });
    }

    const substituicoes = await database("v2_escala_substituicao")
      .select(
        "v2_escala_substituicao.id_substituicao",
        "v2_escala_substituicao.data",
        "v2_escala_substituicao.tipo",
        "v2_escala_substituicao.observacao",
        "v2_turno.numero AS turno",
        "v2_grupamento.sigla AS grupamento",
        "u_sai.id_user AS id_usuario_sai",
        "u_sai.nome AS nome_usuario_sai",
        "u_entra.id_user AS id_usuario_entra",
        "u_entra.nome AS nome_usuario_entra",
      )
      .join("v2_turno", "v2_turno.id_turno", "v2_escala_substituicao.fk_id_turno")
      .join(
        "v2_grupamento",
        "v2_grupamento.id_grupamento",
        "v2_escala_substituicao.fk_id_grupamento",
      )
      .leftJoin("users AS u_sai", "u_sai.id_user", "v2_escala_substituicao.fk_id_usuario_sai")
      .leftJoin(
        "users AS u_entra",
        "u_entra.id_user",
        "v2_escala_substituicao.fk_id_usuario_entra",
      )
      .where("v2_escala_substituicao.data", dataConsulta.objetoDate)
      .orderBy("v2_turno.numero");

    // Mesma anotação informativa do roster mensal — quem "entra" nesse dia
    // por substituição pontual também pode ter afastamento/restrição ativo,
    // e o painel do dia precisa saber disso pra avisar o administrador.
    const idsEntrando = substituicoes.map((s) => s.id_usuario_entra).filter(Boolean);
    const afastamentosPorUsuario = await buscarAfastamentosAtivosPorUsuarios(
      idsEntrando,
      dataConsulta.dataFormatada,
    );
    const substituicoesComAviso = substituicoes.map((s) => ({
      ...s,
      afastamentos_ativos: s.id_usuario_entra
        ? afastamentosPorUsuario.get(s.id_usuario_entra) || []
        : [],
    }));

    return res.status(200).json(substituicoesComAviso);
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// -----------------------------------------------------------------------
// 14) REVERTER SUBSTITUIÇÃO (apaga a exceção — a ausência da linha já
//     significa "sem desvio, vale o vínculo mensal normal daquele dia")
// -----------------------------------------------------------------------
async function reverterSubstituicaoV2(req, res) {
  const { id } = req.params;

  try {
    const substituicao = await database("v2_escala_substituicao")
      .where({ id_substituicao: id })
      .first();

    if (!substituicao) {
      return res.status(404).json({ msg: "Substituição não encontrada" });
    }

    await database("v2_escala_substituicao").where({ id_substituicao: id }).del();

    return res
      .status(200)
      .json({ msg: "Substituição revertida — volta a valer o vínculo mensal normal" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

module.exports = {
  gerarEscalaV2: gerarEscalaV2, // substitui o createEscala em massa
  criarAjusteManualV2: criarAjusteManualV2, // troca pontual em um dia/turno
  listarEscalasV2: listarEscalasV2, // mesmo papel do listarEscalaGuarnicoes
  listarEscalaPeriodoEstendidoV2: listarEscalaPeriodoEstendidoV2, // mês anterior (N dias) + mês seguinte inteiro
  getEscalaV2ById: getEscalaV2ById,
  reverterParaCicloV2: reverterParaCicloV2, // substitui o deleteEscala
  vincularUsuarioGrupamentoV2: vincularUsuarioGrupamentoV2, // substitui o create_guarnicao (stub)
  desvincularUsuarioGrupamentoV2: desvincularUsuarioGrupamentoV2,
  listarMembrosGrupamentoV2: listarMembrosGrupamentoV2, // membros ativos de um grupamento
  criarSubstituicaoAdicaoV2: criarSubstituicaoAdicaoV2, // exceção pontual: adicionar só um dia
  criarSubstituicaoExclusaoV2: criarSubstituicaoExclusaoV2, // exceção pontual: excluir só um dia
  criarSubstituicaoPermutaV2: criarSubstituicaoPermutaV2, // exceção pontual: permutar só um dia
  listarSubstituicoesDoDiaV2: listarSubstituicoesDoDiaV2,
  reverterSubstituicaoV2: reverterSubstituicaoV2, // apaga a exceção pontual
};