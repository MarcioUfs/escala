const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const database = require("../database/db");
const tratarCpf = require("../functions/tratarCpf");
const somenteCpf = require("../functions/somenteCpf");
const tratarMatricula = require("../functions/tratarMatricula");
const somenteMatricula = require("../functions/somenteMatricula");

// async function readUsers(req, res) {
//   await database
//     .select()
//     .table("users")
//     .orderBy("nome")
//     .then((data) => {
//       const arrayDados = [];
//       if (data.length > 0) {
//         for (element of data) {
//           arrayDados.push(
//             JSON.parse(`{
//                         "nome":"${element.nome}",
//                         "cpf":"${tratarCpf(element.cpf)}",
//                         "email":"${element.email}",
//                         "perfil":"${element.role}",
//                         "matricula":"${tratarMatricula(element.matricula)}",
//                         "id":"${element.id_user}"
//                     }`),
//           );
//         }
//         return res.status(200).json(arrayDados);
//       } else {
//         return res.status(404).json({ msg: "Nenhum usuário encontrado!" });
//       }
//     })
//     .catch((error) => {
//       return res.status(500).json({ msg: "Erro do servidor!" });
//     });
// }

async function readUsers(req, res) {
  await database
    .select(
      "users.*", // Pega tudo da tabela users
      "dados_militares.posto_graduacao",
      "dados_militares.abreviacao",
      "dados_militares.peso_hierarquico",
      "dados_militares.anos_servico",
      "dados_militares.meses_servico",
      "dados_militares.dias_servico"
    )
    .from("users")
    // O leftJoin une o ID do usuário com o user_id dos dados militares
    .leftJoin("dados_militares", "users.id_user", "dados_militares.user_id")
    // Ordenação Militar: Primeiro os mais antigos/maior patente, depois desempata por antiguidade ou nome
    .orderBy("dados_militares.peso_hierarquico", "asc")
    .orderBy("dados_militares.anos_servico", "desc")
    .orderBy("users.nome", "asc")
    .then((data) => {
      const arrayDados = [];
      if (data.length > 0) {
        for (let element of data) {
          // Criando o objeto diretamente: mais rápido e à prova de travamentos com aspas no nome
          arrayDados.push({
            nome: element.nome,
            cpf: tratarCpf(element.cpf),
            email: element.email,
            perfil: element.role,
            matricula: tratarMatricula(element.matricula),
            id: element.id_user,
            
            // Dados Militares (com fallback caso o usuário ainda não tenha ficha)
            posto_graduacao: element.posto_graduacao || "Sem Posto",
            abreviacao: element.abreviacao || "",
            peso_hierarquico: element.peso_hierarquico || 99,
            anos_servico: element.anos_servico || 0,
            meses_servico: element.meses_servico || 0,
            dias_servico: element.dias_servico || 0
          });
        }
        return res.status(200).json(arrayDados);
      } else {
        return res.status(404).json({ msg: "Nenhum usuário encontrado!" });
      }
    })
    .catch((error) => {
      console.error(error); // Ajuda você a ver no terminal se der erro
      return res.status(500).json({ msg: "Erro do servidor!" });
    });
}

async function create(req, res) {
  await database
    .select()
    .table("users")
    .where({ cpf: somenteCpf(req.body.cpf) })
    .orWhere({ email: req.body.email })
    .orWhere({ matricula: somenteMatricula(req.body.matricula) })
    .then((data) => {
      if (data.length >= 1) {
        return res
          .status(409)
          .json({ msg: "Email, Matricula ou CPF já cadastrado!" });
      } else {
        bcryptjs.genSalt(10, function (err, salt) {
          bcryptjs.hash(req.body.password, salt, async function (err, hash) {
            const user = {
              email: req.body.email,
              password: hash,
              cpf: somenteCpf(req.body.cpf),
              nome: req.body.nome,
              matricula: somenteMatricula(req.body.matricula),
              role: "user",
              created_at: new Date(),
              updated_at: new Date(),
            };
            try {
              if (
                user.email === "" ||
                user.password === "" ||
                user.cpf === "" ||
                user.nome === "" ||
                user.matricula === "" ||
                user.role === ""
              ) {
                return res.status(403).json({ msg: "Falta algum dado!" });
              }
              await database
                .insert(user)
                .into("users")
                .then((data) => {
                  return res
                    .status(200)
                    .json({ msg: "Cadastrado com sucesso!" });
                })
                .catch((err) => {
                  return res
                    .status(500)
                    .json({ msg: "Erro interno do servidor" });
                });
            } catch (error) {
              return res.status(500).json({ msg: "Erro interno do servidor" });
            }
          });
        });
      }
    })
    .catch((err) => {
      return res.status(500).json({ msg: "Erro do servidor" });
    });
}

async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    const userExists = await database("users").where({ id_user: id }).first();
    if (!userExists) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
    }

    await database("users").where({ id_user: id }).del();

    return res.status(200).json({ msg: "Usuário deletado com sucesso!" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

async function updateUser(req, res) {
  const { id, nome, cpf, email, password, matricula } = req.body;

  // 1. Validações Iniciais
  if (!id || isNaN(id))
    return res.status(400).json({ msg: "ID inválido ou ausente" });
  if (!nome || !cpf || !email || !password || !matricula) {
    return res.status(400).json({ msg: "Dados incompletos!" });
  }

  const cpfOnly = somenteCpf(cpf);
  const matriculaOnly = somenteMatricula(matricula);

  try {
    // 2. Verificar se o usuário que será editado existe
    const userToUpdate = await database("users").where({ id_user: id }).first();
    if (!userToUpdate) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
    }

    // 3. Verificar se os novos dados (CPF, Email, Matrícula) já pertencem a OUTRO usuário
    const conflictCPF = await database("users")
      .where((builder) => {
        builder.where({ cpf: cpfOnly });
      })
      .andWhereNot({ id_user: id }) // Ignora o próprio usuário que está sendo editado
      .first();

    const conflictEmail = await database("users")
      .where((builder) => {
        builder.where({ email });
      })
      .andWhereNot({ id_user: id }) // Ignora o próprio usuário que está sendo editado
      .first();

    const conflictMatricula = await database("users")
      .where((builder) => {
        builder.where({ matricula: matriculaOnly });
      })
      .andWhereNot({ id_user: id }) // Ignora o próprio usuário que está sendo editado
      .first();

    if (conflictCPF || conflictEmail || conflictMatricula) {
      return res
        .status(409)
        .json({ msg: "Email, CPF ou Matrícula já cadastrado em outra conta!" });
    }

    // 4. Hash da senha
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);

    // 5. Executar o Update
    await database("users").where({ id_user: id }).update({
      nome,
      email,
      password: hash,
      cpf: cpfOnly,
      matricula: matriculaOnly,
      updated_at: new Date(), // O Knex/JS lida bem com objetos Date
    });

    return res.status(200).json({ msg: "Usuário atualizado com sucesso!" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

/*************ADMIN CRUD****************/
function loginAdmin(req, res) {
  let cpfOnly = somenteCpf(req.body.cpf);
  
  if (cpfOnly === 0) {
    return res.status(401).send({ msg: "Credencial inválida!" });
  }
  database
    .select()
    .table("admins")
    .where({ cpf: cpfOnly })
    .then((data) => {
      if (data.length <= 0) {
        return res.status(401).send({ msg: "Credencial inválida!" });
      } else {
        bcryptjs.compare(
          req.body.password,
          data[0].password,
          function (err, result) {
            if (result) {
              const token = jwt.sign(
                {
                  // email: data[0].email,
                  id_admin: data[0].id_admin,
                  //matricula: data[0].matricula,
                  role: data[0].role,
                },
                process.env.SECRET_ADMIN,
                { expiresIn: "6h" },
                function (err, token) {
                  return res.status(200).json({
                    msg: "Autenticação com sucesso!",
                    // nome: data[0].nome,
                    id: data[0].id_admin,
                    role: data[0].role,
                    // matricula: data[0].matricula,
                    token: token,
                  });
                },
              );
            } else {
              return res.status(401).json({ msg: "Dados inválidos!!!" });
            }
          },
        );
      }
    })
    .catch((error) => {
      return res.status(500).json({ msg: "Erro do servidor!" });
    });
}

async function createAdmin(req, res) {
  await database
    .select()
    .table("admins")
    .where({ cpf: req.body.cpf })
    .orWhere({ email: req.body.email })
    .orWhere({ matricula: req.body.matricula })
    .then((data) => {
      if (data.length >= 1) {
        return res
          .status(409)
          .json({ msg: "Email, Matricula ou CPF já cadastrado!" });
      } else {
        bcryptjs.genSalt(10, function (err, salt) {
          bcryptjs.hash(req.body.password, salt, async function (err, hash) {
            const admin = {
              email: req.body.email,
              password: hash,
              cpf: req.body.cpf,
              nome: req.body.nome,
              matricula: req.body.matricula,
              role: req.body.role,
              created_at: new Date(),
              updated_at: new Date(),
            };
            try {
              if (
                admin.email === "" ||
                admin.password === "" ||
                admin.cpf === "" ||
                admin.nome === "" ||
                admin.matricula === "" ||
                admin.role === ""
              ) {
                return res.status(403).json({ msg: "Falta algum dado!" });
              }
              await database
                .insert(admin)
                .into("admins")
                .then((data) => {
                  return res
                    .status(200)
                    .json({ msg: "Cadastrado com sucesso!" });
                })
                .catch((err) => {
                  return res
                    .status(500)
                    .json({ msg: "Erro interno do servidor" });
                });
            } catch (error) {
              return res
                .status(500)
                .json({ msg: "Erro interno do servidor" });
            }
          });
        });
      }
    })
    .catch((err) => {
      return res.status(500).json({ msg: "Erro do servidor" });
    });
}

async function getAdmin(req, res) {
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.SECRET_ADMIN, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "Token inválido ou expirado" });
    } else {
      await database
        .table("admins")
        .where({ id_admin: decoded.id_admin })
        .then((data) => {
          if (data.length <= 0) {
            return res.status(404).send({ msg: "Administrador não encontrado" });
          } else {
            const userData = {
              nome: data[0].nome,
              cpf: tratarCpf(data[0].cpf),
              email: data[0].email,
              matricula: tratarMatricula(data[0].matricula),
              id: data[0].id_admin,
              role: data[0].role,
            };
            return res.status(200).send(userData);
          }
        })
        .catch((error) => {
          return res.status(500).json({ msg: `Erro do servidor ${error}` });
        });
    }
  });
}

module.exports = {
  readUsers: readUsers,
  create: create,
  deleteUser: deleteUser,
  updateUser: updateUser,

  loginAdmin: loginAdmin,
  createAdmin: createAdmin,
  getAdmin: getAdmin,
};
