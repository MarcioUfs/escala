const e = require("express");
const database = require("../database/db");
const limparEspaco = require("../functions/limparEspacos");
const somenteCpf = require("../functions/somenteCpf");
const somenteMatricula = require("../functions/somenteMatricula");
// const somenteTelefone = require("../functions/somenteTelefone");

// async function createModeloEscala(req, res) {
//   nome = limparEspaco(req.body.nome);
//   codigo = limparEspaco(req.body.codigo);
//   descricao = limparEspaco(req.body.descricao);
//   try {
//     if (!nome || !codigo || !descricao) {
//       return res.status(400).json({
//         msg: "nome, codigo e descrição são obrigatórios",
//       });
//     }

//     await database
//       .select()
//       .table("modelos_escala")
//       .where({ codigo: req.body.codigo })
//       .then(async (data) => {
//         if (data.length >= 1) {
//           return res
//             .status(409)
//             .json({ msg: "Modelo de escala já cadastrado!" });
//         } else {
//           await database
//             .insert({
//               nome,
//               codigo,
//               ativo: true,
//               descricao: descricao || "Sem descrição",
//               created_at: new Date(),
//               updated_at: new Date(),
//             })
//             .into("modelos_escala")
//             .then((data) => {
//               return res.status(201).json({
//                 msg: "Modelo de escala criado com sucesso",
//               });
//             });
//         }
//       });
//   } catch (error) {
//     return res.status(500).json({
//       msg: "Erro ao criar modelo de escala",
//       error: error,
//       error: error.message,
//     });
//   }
// }
// async function deleteSoftModeloEscala(req, res) {
//   const { id } = req.params;
//   try {
//     const modeloExists = await database("modelos_escala")
//       .where({ id: id, ativo: true })
//       .first();

//     if (modeloExists) {
//       await database("modelos_escala")
//         .where({ id: id })
//         .update({ ativo: false, updated_at: new Date() });

//       return res
//         .status(200)
//         .json({ msg: "Modelo de escala deletado com sucesso!" });
//     } else {
//       return res.status(404).json({ msg: "Modelo de escala não encontrado" });
//     }
//   } catch (error) {
//     return res.status(500).json({ msg: "Erro interno do servidor" });
//   }
// }

// // async function deleteSoftModeloEscala(req, res) {
// //   const { id } = req.params;
// //   try {
// //     const modeloExists = await database("modelos_escala")
// //       .where({ id: id, ativo: true })
// //       .first();

// //     if (modeloExists) {
// //       await database("modelos_escala")
// //         .where({ id: id })
// //         .update({ ativo: false });

// //       return res
// //         .status(200)
// //         .json({ msg: "Modelo de escala deletado com sucesso!" });
// //     } else {
// //       return res.status(404).json({ msg: "Modelo de escala não encontrado" });
// //     }
// //   } catch (error) {
// //     return res.status(500).json({ msg: "Erro interno do servidor" });
// //   }
// // }
async function listarEscalas(req, res) {
  try {
    const guarnicoes = await database("escalas_servicos")
      .select("*")
      .where({ status: true });
    console.log("Guarnições listadas:", guarnicoes.length);  
    if(guarnicoes.length <= 0) {
      return res.status(404).json({ msg: "Nenhuma guarnição ativa encontrada" });
    }
    return res.status(200).json(guarnicoes);
  } catch (error) {
    console.error("Erro ao listar guarnições:", error);
    return res.status(500).json({
      msg: "Erro interno do servidor",
    });
  }
}

async function getEscalaById(req, res) {
  const { id } = req.params;
  try {
    const escala = await database("escalas_servicos")
      .select("*")
      .where({ id: id, status: true })
      .first();
    if (escala) {
      return res.status(200).json(escala);
    } else {
      return res.status(404).json({ msg: "Escala não encontrada" });
    }
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}
async function create_guarnicao(req, res) {
  console.log("Dados recebidos para criação de guarnição:", req.body);
  await database
    .select()
    .table("tbl_guarnicao")
    .where({ turno: req.body.turno })
    // .andWhere({ dia: req.body.dia })
    .then((data) => {
      if (data.length > 1) {
        return res
          .status(409)
          .json({ msg: "Turno já cadastrado!" });
      } else {
            const guarnicao = {
              data_guarnicao:req.body.data_guarnicao,
              hora_guarnicao:req.body.hora_guarnicao,
              dayofyear:req.body.dayofyear,
              turno:req.body.turno,
              grupamento:req.body.grupamento,
              dados_guarnicao:req.body.dados_guarnicao,
              created_at: new Date(),
              updated_at: new Date(),
            };
            try {
              database
                .insert(guarnicao)
                .into("tbl_guarnicao")
                .then((data) => {
                  return res
                    .status(200)
                    .json({ msg: "Cadastrado com sucesso!" });
                })
                .catch((err) => {
                   
                  return res
                    .status(501)
                    .json({ msg: "Erro interno do servidor", error: err });
                });
            } catch (error) {
              return res
                .status(500)
                .json({ msg: "Erro interno do servidor", error: error });
            }
      }
    })
    .catch((err) => {
      console.error("Erro ao verificar turno existente:", err);
      return res.status(502).json({ msg: "Erro do servidor" , error: err });
    });
}

module.exports = {
  //   createModeloEscala: createModeloEscala,
  //   deleteSoftModeloEscala: deleteSoftModeloEscala,
  listarEscalas: listarEscalas,
  getEscalaById: getEscalaById,


  /*
  OUTRA ABORDAGEM PARA O CRUD DE MODELOS DE ESCALA:
  */
  create_guarnicao: create_guarnicao,

};
