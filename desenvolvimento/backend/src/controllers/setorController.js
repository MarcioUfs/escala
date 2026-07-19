const database = require("../database/db");

// ================= CREATE =================
async function createSetor(req, res) {
  const { nome_setor, sigla } = req?.body;

  if (!req.body?.nome_setor || req.body?.nome_setor === "") {
    return res.status(400).json({ msg: "Nome é obrigatório!" });
  }
  if (!req.body?.sigla || req.body?.sigla === "") {
    return res.status(400).json({ msg: "Sigla é obrigatória!" });
  }

  await database
    .select()
    .table("tbl_setores")
    .where({ nome_setor: nome_setor.toUpperCase() })
    .then(async (data) => {
      if (data.length >= 1) {
        return res.status(409).json({ msg: "Nome do setor já cadastrado!" });
      } else {
        const novoSetor = {
          nome_setor: nome_setor.toUpperCase(),
          sigla: sigla.toUpperCase(),
          is_active: true, // Default definido no schema
          created_at: new Date(),
          updated_at: new Date(),
        };
        try {
          await database
            .insert(novoSetor)
            .into("tbl_setores")
            .then(() => {
              return res
                .status(200)
                .json({ msg: "Setor cadastrado com sucesso!" });
            })
            .catch((err) => {
              return res.status(501).json({
                msg: "Erro interno do servidor ao inserir",
                error: err,
              });
            });
        } catch (error) {
          return res.status(500).json({ msg: "Erro interno do servidor" });
        }
      }
    })
    .catch((err) => {
      return res.status(502).json({ msg: "Erro do servidor" });
    });
}

// ================= READ =================
async function readSetores(req, res) {
  await database
    .select(
      "id_setor",
      "nome_setor",
      "sigla",
      "is_active",
      "created_at",
      "updated_at",
    )
    .from("tbl_setores")
    .orderBy("nome_setor", "asc")
    .then((data) => {
      if (data.length > 0) {
        return res.status(200).json(data);
      } else {
        return res.status(404).json({ msg: "Nenhum setor encontrado!" });
      }
    })
    .catch((error) => {
      return res.status(500).json({ msg: "Erro do servidor!" });
    });
}

// ================= UPDATE =================
async function updateSetor(req, res) {
  // const { id } = req.params;
  // Seguindo a sua lógica do adminController, recebendo o ID pelo body
  const { id_setor, nome_setor, sigla, is_active } = req?.body;
  // console.log(`!id = ${!id} id = ${id} id_setor: ${id_setor} resultado = ${!id && Number(id) !== Number(id_setor)}`);
  // if (!id || Number(id) !== Number(id_setor)) {
  //   return res.status(400).json({
  //     msg: "Violação de integridade na solicitação!",
  //   });
  // }
  if (!id_setor || isNaN(id_setor)) {
    return res.status(400).json({ msg: "ID inválido ou ausente" });
  }
  if (!nome_setor || nome_setor === "") {
    return res.status(400).json({ msg: "Informe o nome do setor!" });
  }
  if (!sigla || sigla === "") {
    return res.status(400).json({ msg: "Informe a sigla do setor!" });
  }

  try {
    // 1. Verifica se o setor existe
    const setorToUpdate = await database("tbl_setores")
      .where({ id_setor: id_setor })
      .first();
    if (!setorToUpdate) {
      return res.status(404).json({ msg: "Setor não encontrado" });
    }

    // 2. Verifica se o novo nome_setor já pertence a OUTRO setor (evita erro de constraint unique)
    const conflictNome = await database("tbl_setores")
      .where({ nome_setor: nome_setor })
      .andWhereNot({ id_setor: id_setor })
      .first();

    if (conflictNome) {
      return res
        .status(409)
        .json({ msg: "Já existe outro setor cadastrado com este nome!" });
    }

    // 3. Executa a atualização
    await database("tbl_setores")
      .where({ id_setor: id_setor })
      .update({
        nome_setor,
        sigla,
        // Se is_active for enviado (true/false), ele atualiza, senão mantém o atual
        is_active:
          typeof is_active !== "undefined"
            ? is_active
            : setorToUpdate.is_active,
        updated_at: new Date(),
      });

    return res.status(200).json({ msg: "Setor atualizado com sucesso!" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

async function activeSetor(req, res) {
  try {
    const { id, is_active } = req?.body;

    if (!id || id === "" || isNaN(id) || !("id" in req?.body)) {
      return res.status(400).json({ msg: "ID é obrigatório!" });
    }

    if (
      !("is_active" in req?.body) ||
      is_active === "" ||
      typeof is_active !== "boolean"
    ) {
      return res
        .status(400)
        .json({ msg: "O atributo de verificação é obrigatório!" });
    }

    const setorExists = await database("tbl_setores")
      .where({ id_setor: id })
      .first();

    if (!setorExists) {
      return res.status(404).json({ msg: "Setor não encontrado" });
    }

    await database("tbl_setores")
      .where({ id_setor: id })
      .update({ is_active: is_active ? true : false, updated_at: new Date() });

    return res.status(200).json({
      msg: `Setor ${is_active ? "ativado" : "desativado"} com sucesso!`,
    });
  } catch (error) {
    console.error("Erro ao desativar setor:", error);
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}
// ================= DELETE =================
async function deleteSetor(req, res) {
  const { id } = req.params;
  // console.log(`Body: ${JSON.stringify(req.body)}, Params: ${JSON.stringify(req.params)}`);
  
  try {
    // const idAdmin = await database("admins")
    //   .where({ id_admin: req.user.id_admin })
    //   .first();
    
    // console.log("Admin:", idAdmin);
    const setorExists = await database("tbl_setores")
      .where({ id_setor: id })
      .first();
    if (!setorExists) {
      return res.status(404).json({ msg: "Setor não encontrado" });
    }

    // ATENÇÃO: Como tbl_setores tem relação com admins e tbl_escala (ON DELETE SET NULL),
    // a exclusão aqui passará o fk_id_setor dessas tabelas filhas para NULL automaticamente.
    await database("tbl_setores").where({ id_setor: id }).del();

    return res.status(200).json({ msg: "Setor deletado com sucesso!" });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Erro interno do servidor", error: error });
  }
}

module.exports = {
  createSetor: createSetor,
  readSetores: readSetores,
  updateSetor: updateSetor,
  activeSetor: activeSetor,
  deleteSetor: deleteSetor,
};
