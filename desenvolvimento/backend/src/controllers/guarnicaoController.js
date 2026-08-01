const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const database = require("../database/db");
const tratarCpf = require("../functions/tratarCpf");
const somenteCpf = require("../functions/somenteCpf");
const tratarMatricula = require("../functions/tratarMatricula");
const somenteMatricula = require("../functions/somenteMatricula");
const tratarTelefone = require("../functions/tratarTelefone");
const validarEmail = require("../functions/validarEmail");
const validateFields = require("../functions/validarCampos");
const somenteTelefone = require("../functions/somenteTelefone");
const limparEspacos = require("../functions/limparEspacos");

async function createGuarnicao(req, res) {
  console.log("Dados recebidos para criação de guarnição:", req.body);
  const resultDados = false;

  if (!req.body?.data_guarnicao || req.body?.data_guarnicao === "") {
    return res.status(400).json({ msg: "Data guarnição é obrigatório!" });
  }
  if (!req.body?.hora_guarnicao || req.body?.hora_guarnicao === "") {
    return res.status(400).json({ msg: "Hora é obrigatório!" });
  }
  if (!req.body?.dados_guarnicao || req.body?.dados_guarnicao === "") {
    // resultDados = true;
  }
  if (!req.body?.dayofyear || req.body?.dayofyear === "") {
    return res.status(400).json({ msg: "Este campo é obrigatório!" });
  }
  if (!req.body?.turno || req.body?.turno === "") {
    return res.status(400).json({ msg: "Este campo é obrigatório!" });
  }
  if (!req.body?.grupamento || req.body?.grupamento === "") {
    return res.status(400).json({ msg: "Este campo é obrigatório!" });
  }
  if (!req.body?.fk_id_escala || req.body?.fk_id_escala === "") {
    return res.status(400).json({ msg: "Este campo é obrigatório!" });
  }
  const {
    id_guarnicao,
    data_guarnicao,
    hora_guarnicao,
    dados_guarnicao,
    dayofyear,
    turno,
    grupamento,
    fk_id_escala,
  } = req?.body;
  // console.log("resultG>>" + resultDados);

  // "id_guarnicao":"",
  // "data_guarnicao":"",
  // "hora_guarnicao":"",
  // "dados_guarnicao":"",
  // "dayofyear":"",
  // "turno":"",
  // "grupamento":"",
  // "fk_id_escala":"",
  await database
    .select()
    .table("tbl_guarnicao")
    .where({ data_guarnicao: data_guarnicao})
    .andWhere({turno: turno})
    .then(async (data) => {
      if (data.length >= 1) {
        return res.status(409).json({ msg: "Escala já cadastrada!" });
      } else {
        const novaGuarnicao = {
          data_guarnicao: data_guarnicao,
          hora_guarnicao: hora_guarnicao,
          dados_guarnicao: dados_guarnicao,
          dayofyear: dayofyear,
          turno: turno,
          grupamento: grupamento,
          fk_id_escala: fk_id_escala,
          created_at: new Date(),
          updated_at: new Date(),
        };
        try {
          await database
            .insert(novaGuarnicao)
            .into("tbl_guarnicao")
            .then(() => {
              return res
                .status(200)
                .json({ msg: "Guarnição cadastrada com sucesso!" });
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
module.exports = {
  createGuarnicao: createGuarnicao,
};
