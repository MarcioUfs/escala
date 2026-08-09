const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const database = require("../database/db");
const tratarCpf = require("../functions/tratarCpf");
const somenteCpf = require("../functions/somenteCpf");
const tratarMatricula = require("../functions/tratarMatricula");
const somenteMatricula = require("../functions/somenteMatricula");
const tratarTelefone = require("../functions/tratarTelefone");

// function login(req, res) {
//   if (
//     !req.body?.cpf ||
//     req.body?.cpf === "" ||
//     somenteCpf(req.body?.cpf) === 0
//   ) {
//     return res.status(400).json({ msg: "CPF é obrigatório!" });
//   }

//   if (!req.body?.password || req.body?.password === "") {
//     return res.status(400).json({ msg: "Senha é obrigatória!" });
//   }

//   let cpfOnly = somenteCpf(req.body.cpf);

//   database
//     .select()
//     .table("users")
//     .where({ cpf: cpfOnly })
//     .then((data) => {
//       if (data.length <= 0) {
//         return res.status(401).send({ msg: "Credencial inválida!" });
//       } else {
//         bcryptjs.compare(
//           req.body.password,
//           data[0].password,
//           function (err, result) {
//             if (result) {
//               const token = jwt.sign(
//                 {
//                   // email: data[0].email,
//                   id_user: data[0].id_user,
//                   // matricula: data[0].matricula,
//                   // cpf: data[0].cpf,
//                   role: data[0].role,
//                 },
//                 process.env.SECRET,
//                 { expiresIn: "6h" },
//                 function (err, token) {
//                   return res.status(200).json({
//                     msg: "Autenticação com sucesso!",
//                     id: data[0].id_user,
//                     role: data[0].role,
//                     nome: data[0].nome,
//                     // cpf: tratarCpf(data[0].cpf),
//                     // matricula: tratarMatricula(data[0].matricula),
//                     tokenUser: token,
//                   });
//                 },
//               );
//             } else {
//               return res.status(401).json({ msg: "Dados inválidos!!!" });
//             }
//           },
//         );
//       }
//     })
//     .catch((error) => {
//       return res.status(500).json({ msg: "Erro do servidor!" });
//     });
// }

async function login(req, res) {
  if (!req.body?.cpf || req.body?.cpf === "" || somenteCpf(req.body?.cpf) === 0) {
    return res.status(400).json({ msg: "CPF é obrigatório!" });
  }
  if (!req.body?.password || req.body?.password === "") {
    return res.status(400).json({ msg: "Senha é obrigatória!" });
  }

  const cpfOnly = somenteCpf(req.body.cpf);

  try {
    const data = await database.select().table("users").where({ cpf: cpfOnly });

    if (data.length <= 0) {
      return res.status(401).json({ msg: "Credencial inválida!" });
    }

    const user = data[0];
    const senhaCorreta = await bcryptjs.compare(req.body.password, user.password);

    if (!senhaCorreta) {
      return res.status(401).json({ msg: "Dados inválidos!!!" });
    }

    const token = jwt.sign(
      { id_user: user.id_user, role: user.role },
      process.env.SECRET,
      { expiresIn: "6h" }
    );

    return res.status(200).json({
      msg: "Autenticação com sucesso!",
      id: user.id_user,
      role: user.role,
      nome: user.nome,
      token: token,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Erro do servidor!" });
  }
}

// async function getUser(req, res) {
//   const decoded = req.user; // Assuming the decoded token is available in req.user

//   await database
//     .table(
//       "users.id_user",
//       "users.email",
//       "users.cpf",
//       "users.nome",
//       "users.matricula",
//       "users.role",
//       "users.telefone",
//       "users.nome_guerra",
//       "users.is_active AS ativo",
//       "users.updated_at",
//       "tbl_patentes.id_patente",
//       "tbl_patentes.nome_patente",
//       "tbl_patentes.sigla_patente",
//     )
//     .where({ id_user: decoded.id_user })
//     .from("users")
//     .leftJoin("tbl_patentes", "users.id_patente", "tbl_patentes.id_patente")
//     .then((data) => {
//       if (data.length <= 0) {
//         return res.status(404).send({ msg: "Usuário não encontrado" });
//       } else {
//         const userData = {
//           nome: data[0].nome,
//           cpf: tratarCpf(data[0].cpf),
//           email: data[0].email,
//           matricula: tratarMatricula(data[0].matricula),
//           telefone: tratarTelefone(data[0].telefone),
//           nome_guerra: data[0].nome_guerra,
//           id_patente: data[0].id_patente || "---",
//           patente_nome: data[0].nome_patente || "---",
//           patente_sigla: data[0].sigla_patente || "---",
//           ativo: data[0].is_active ? "Ativo" : "Inativo",
//           updated_at: data[0].updated_at,
//           // patente: data[0].patente || "---",
//           id: data[0].id_user,
//           role: data[0].role,
//         };
//         return res.status(200).send(userData);
//       }
//     })
//     .catch((error) => {
//       return res.status(500).json({ msg: `Erro do servidor ${error}` });
//     });
// }
async function getUser(req, res) {
  const { id_user } = req.user;

  try {
    const data = await database
      .table(
        "users.id_user",
        "users.email",
        "users.cpf",
        "users.nome",
        "users.matricula",
        "users.role",
        "users.telefone",
        "users.nome_guerra",
        "users.is_active AS ativo",
        "users.updated_at",
        "tbl_patentes.id_patente",
        "tbl_patentes.nome_patente",
        "tbl_patentes.sigla_patente",
      )
      .where({ id_user })
      .from("users")
      .leftJoin("tbl_patentes", "users.id_patente", "tbl_patentes.id_patente");

    if (data.length <= 0) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
    }

    const userData = {
      nome: data[0].nome,
      cpf: tratarCpf(data[0].cpf),
      email: data[0].email,
      matricula: tratarMatricula(data[0].matricula),
      telefone: tratarTelefone(data[0].telefone),
      nome_guerra: data[0].nome_guerra,
      id_patente: data[0].id_patente || "---",
      patente_nome: data[0].nome_patente || "---",
      patente_sigla: data[0].sigla_patente || "---",
      ativo: data[0].ativo ? "Ativo" : "Inativo",
      updated_at: data[0].updated_at,
      id: data[0].id_user,
      role: data[0].role,
    };

    return res.status(200).json(userData);
  } catch (error) {
    return res.status(500).json({ msg: "Erro do servidor!" });
  }
}

async function updatePassword(req, res) {
  if (!req.body?.newPassword || req.body?.newPassword === "" || req.body?.newPassword.length < 6) {
    return res.status(400).json({ msg: "A nova senha deve ter pelo menos 6 caracteres!" });
  }
  if (!req.body?.oldPassword || req.body?.oldPassword === "" || req.body?.oldPassword.length < 6) {
    return res.status(400).json({ msg: "A senha antiga deve ter pelo menos 6 caracteres!" });
  }
  if (!req.body?.confirmNewPassword || req.body?.confirmNewPassword === "" || req.body?.confirmNewPassword.length < 6) {
    return res.status(400).json({ msg: "A confirmação da nova senha deve ter pelo menos 6 caracteres!" });
  }

  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ msg: "A nova senha e a confirmação não coincidem." });
  }
  if (newPassword === oldPassword) {
    return res.status(400).json({ msg: "A nova senha deve ser diferente da senha antiga." });
  }

  const userId = req.user.id_user;
  if (!userId) {
    return res.status(401).json({ msg: "Acesso negado. Usuário não autenticado." });
  }

  try {
    // 1. Busca o usuário
    const users = await database.select("*").table("users").where({ id_user: userId });
    if (users.length === 0) {
      return res.status(404).json({ msg: "Usuário não encontrado no sistema." });
    }
    const user = users[0];

    // 2. Confirma a senha antiga
    const senhaCorreta = await bcryptjs.compare(oldPassword, user.password);
    if (!senhaCorreta) {
      return res.status(401).json({ msg: "A senha antiga está incorreta." });
    }

    // 3. Gera o hash da nova senha
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(newPassword, salt);

    // 4. Salva no banco
    await database.table("users").where({ id_user: userId }).update({
      password: hash,
      updated_at: new Date(),
    });

    return res.status(200).json({ msg: "Senha atualizada com sucesso!" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// async function updatePassword(req, res) {
//   if (
//     !req.body?.newPassword ||
//     req.body?.newPassword === "" ||
//     req.body?.newPassword.length < 6
//   ) {
//     return res
//       .status(400)
//       .json({ msg: "A nova senha deve ter pelo menos 6 caracteres!" });
//   }
//   if (
//     !req.body?.oldPassword ||
//     req.body?.oldPassword === "" ||
//     req.body?.oldPassword.length < 6
//   ) {
//     return res
//       .status(400)
//       .json({ msg: "A senha antiga deve ter pelo menos 6 caracteres!" });
//   }
//   if (
//     !req.body?.confirmNewPassword ||
//     req.body?.confirmNewPassword === "" ||
//     req.body?.confirmNewPassword.length < 6
//   ) {
//     return res
//       .status(400)
//       .json({
//         msg: "A confirmação da nova senha deve ter pelo menos 6 caracteres!",
//       });
//   }
//   // 1. Extração e Validação Inicial dos Campos
//   const { oldPassword, newPassword, confirmNewPassword } = req.body;
//   // if (!oldPassword || !newPassword || !confirmNewPassword) {
//   //   return res
//   //     .status(400)
//   //     .json({ msg: "Preencha a senha antiga, a nova e a confirmação." });
//   // }

//   if (newPassword !== confirmNewPassword) {
//     return res
//       .status(400)
//       .json({ msg: "A nova senha e a confirmação não coincidem." });
//   }

//   if (newPassword === oldPassword) {
//     return res
//       .status(400)
//       .json({ msg: "A nova senha deve ser diferente da senha antiga." });
//   }

//   // 2. Identificação do Usuário via Token
//   // Assumindo que seu middleware de auth coloca o ID do dono do token em req.userId
//   const userId = req.user.id_user;

//   if (!userId) {
//     return res
//       .status(401)
//       .json({ msg: "Acesso negado. Usuário não autenticado." });
//   }

//   try {
//     // 3. Buscar os dados atuais do usuário no banco
//     const users = await database
//       .select("*")
//       .table("users")
//       .where({ id_user: userId });

//     if (users.length === 0) {
//       return res
//         .status(404)
//         .json({ msg: "Usuário não encontrado no sistema." });
//     }

//     const user = users[0];

//     // 4. Comparar a senha antiga enviada com o hash salvo no banco
//     bcryptjs.compare(oldPassword, user.password, function (err, isMatch) {
//       if (err) {
//         return res
//           .status(500)
//           .json({ msg: "Erro ao verificar a credencial antiga", error: err });
//       }

//       if (!isMatch) {
//         return res.status(401).json({ msg: "A senha antiga está incorreta." });
//       }

//       // 5. Se a senha antiga estiver correta, geramos o hash da nova senha
//       bcryptjs.genSalt(10, function (err, salt) {
//         if (err) {
//           return res
//             .status(500)
//             .json({ msg: "Erro ao gerar parâmetros de segurança", error: err });
//         }

//         bcryptjs.hash(newPassword, salt, async function (err, hash) {
//           if (err) {
//             return res
//               .status(500)
//               .json({ msg: "Erro ao criptografar a nova senha", error: err });
//           }

//           // 6. Atualizar a senha no banco de dados
//           try {
//             await database.table("users").where({ id_user: userId }).update({
//               password: hash,
//               updated_at: new Date(),
//             });

//             return res
//               .status(200)
//               .json({ msg: "Senha atualizada com sucesso!" });
//           } catch (updateError) {
//             return res.status(500).json({
//               msg: "Erro interno ao salvar a nova senha",
//               error: updateError,
//             });
//           }
//         });
//       });
//     });
//   } catch (dbError) {
//     return res
//       .status(500)
//       .json({ msg: "Erro de conexão com o banco de dados", error: dbError });
//   }
// }

//SEM USO AINDA
// async function updateMyUser(req, res) {
//   if (isNaN(req.params.id)) {
//     return res.status(404).send({ msg: "Usuário não encontrado" });
//   }

//   // Verifica se os campos obrigatórios estão preenchidos
//   if (!req.body.nome || !req.body.cpf || !req.body.email) {
//     return res.status(403).send({ msg: "Dados incompletos!" });
//   }

//   const user = {
//     email: req.body.email,
//     cpf: req.body.cpf,
//     nome: req.body.nome,
//   };

//   try {
//     // Atualiza os dados do usuário no banco de dados
//     await database
//       .table("users")
//       .where({ id_user: req.params.id })
//       .update(user)
//       .then((data) => {
//         if (data === 0) {
//           return res.status(404).send({ msg: "Usuário não encontrado" });
//         } else {
//           return res.status(200).json({ msg: "Atualizado com sucesso!" });
//         }
//       })
//       .catch((err) => {
//         return res.status(500).json({ msg: "Erro interno do servidor" });
//       });
//   } catch (error) {
//     return res.status(500).json({ msg: "Erro interno do servidor" });
//   }
// }

// async function catchUser(req, res) {
//   await database
//     .table("users")
//     .where({ id_user: req.body.id })
//     .then((data) => {
//       if (data.length <= 0) {
//         return res.status(404).send({ msg: "Usuário não encontrado" });
//       } else {
//         let result = JSON.parse(`{
//                 "nome":"${data[0].nome}",
//                 "cpf":"${data[0].cpf}",
//                 "email":"${data[0].email}",
//                 "role":"${data[0].role}",
//                 "id":"${data[0].id_user}"
//             }`);
//         return res.status(200).send(result);
//       }
//     })
//     .catch((error) => {
//       return res.status(500).json({ msg: `"Erro do servidor ${error}"` });
//     });
// }

module.exports = {
  login: login,
  getUser: getUser,
  updatePassword: updatePassword,
  // updateMyUser: updateMyUser,
  // catchUser: catchUser,
};
