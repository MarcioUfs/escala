const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const database = require("../database/db");
const tratarCpf = require("../functions/tratarCpf");
const somenteCpf = require("../functions/somenteCpf");
const tratarMatricula = require("../functions/tratarMatricula");
const somenteMatricula = require("../functions/somenteMatricula");
const tratarTelefone = require("../functions/tratarTelefone");
const validateEmail = require("../functions/validarEmail");
const validateFields = require("../functions/validarCampos");
const somenteTelefone = require("../functions/somenteTelefone");

async function readUsers(req, res) {
  await database
    .select(
      "users.id_user",
      "users.email",
      "users.cpf",
      "users.nome",
      "users.matricula",
      "users.role",
      "users.telefone",
      "users.is_active AS ativo",
      "users.updated_at",
      "efetivo_antiguidade.nome AS nome_militar",
      "efetivo_antiguidade.ordem",
      "efetivo_antiguidade.patente",
      "efetivo_antiguidade.quadro",
      "efetivo_antiguidade.data_promocao",
      "efetivo_antiguidade.tempo_promocao",
    )
    .from("users")
    .leftJoin(
      "efetivo_antiguidade",
      "users.matricula",
      "efetivo_antiguidade.matricula",
    )
    .orderByRaw("efetivo_antiguidade.ordem ASC NULLS LAST")
    .then((data) => {
      const arrayDados = [];
      if (data.length > 0) {
        for (let element of data) {
          arrayDados.push({
            id: element.id_user,
            nome: element.nome_militar || element.nome,
            cpf: tratarCpf(element.cpf),
            email: element.email,
            matricula: tratarMatricula(element.matricula),
            perfil: element.role,
            telefone: tratarTelefone(element.telefone) ,
            ativo: element.ativo,

            ordem: element.ordem || Math.floor(Math.random() * 100000) + 100001,
            patente: element.patente || "Sem Posto",
            quadro: element.quadro || "Sem Quadro",
            data_promocao: element.data_promocao || "01/01/1900",
            tempo_promocao: element.tempo_promocao || "0 anos",
          });
        }
        return res.status(200).json(arrayDados);
      } else {
        return res.status(404).json({ msg: "Nenhum usuário encontrado!" });
      }
    })
    .catch((error) => {
      return res.status(500).json({ msg: "Erro do servidor!"});
    });
}

async function create(req, res) {

  // const isValid = validateFields(req, res, [
  //   "email",
  //   "password",
  //   "cpf",
  //   "nome",
  //   "matricula",
  //   "telefone"
  // ]);
  // if (!isValid) return;

  // const isValidEmail = validateEmail(req, res);
  // if (!isValidEmail) return;

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
              nome: req.body.nome,
              cpf: somenteCpf(req.body.cpf),
              matricula: somenteMatricula(req.body.matricula),
              telefone: somenteTelefone(req.body.telefone),
              role: "user",
              created_at: new Date(),
              updated_at: new Date(),
            };
            try {
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
                    .status(501)
                    .json({ msg: "Erro interno do servidor", error: err });
                });
            } catch (error) {
              return res
                .status(500)
                .json({ msg: "Erro interno do servidor", error: error });
            }
          });
        });
      }
    })
    .catch((err) => {
      return res.status(502).json({ msg: "Erro do servidor" });
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
      email,
      password: hash,
      nome,
      cpf: cpfOnly,
      matricula: matriculaOnly,
      telefone: req.body.telefone || null,
      updated_at: new Date(),
    });

    return res.status(200).json({ msg: "Usuário atualizado com sucesso!" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}
/*************LISTAR ALL****************/
async function readAllPm(req, res) {
  await database
    .select("efetivo_antiguidade.*")
    .from("efetivo_antiguidade")
    .orderByRaw("efetivo_antiguidade.ordem ASC NULLS LAST")
    .then((data) => {
      const arrayDados = [];
      if (data.length > 0) {
        for (let element of data) {
          arrayDados.push({
            id: element.id,
            nome: element.nome,
            ordem: element.ordem,
            patente: element.patente,
            matricula: tratarMatricula(element.matricula),
            quadro: element.quadro,
            patente: element.patente,
            data_promocao: element.data_promocao,
            tempo_promocao: element.tempo_promocao,
          });
        }
        return res.status(200).json(arrayDados);
      } else {
        return res.status(404).json({ msg: "Nenhum usuário encontrado!" });
      }
    })
    .catch((error) => {
      return res.status(500).json({ msg: "Erro do servidor!" });
    });
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
  console.log("Requisição para criar admin recebida:", req.body); // Log da requisição
  await database
    .select()
    .table("admins")
    .where({ cpf: somenteCpf(req.body.cpf) })
    .then((data) => {
      if (data.length >= 1) {
        return res
          .status(409)
          .json({ msg: "Email ou CPF já cadastrado!" });
      } else {
        bcryptjs.genSalt(10, function (err, salt) {
          bcryptjs.hash(req.body.password, salt, async function (err, hash) {
            const admin = {
              password: hash,
              nome: req.body.nome,
              cpf: somenteCpf(req.body.cpf),
              role: "admin",
              created_at: new Date(),
              updated_at: new Date(),
            };
            try {
              if (
                admin.password === "" ||
                admin.nome === "" ||
                admin.cpf === "" ||
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
                    .status(501)
                    .json({ msg: "Erro interno do servidor", error: err });
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
            return res
              .status(404)
              .send({ msg: "Administrador não encontrado" });
          } else {
            const userData = {
              id: data[0].id_admin,
              nome: data[0].nome,
              cpf: tratarCpf(data[0].cpf),
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

async function readAdmins(req, res) {
  await database
    .select("admins.*")
    .from("admins")
    .orderByRaw("admins.id_admin ASC NULLS LAST")
    .then((data) => {
      const arrayDados = [];
      if (data.length > 0) {
        for (let element of data) {
          arrayDados.push({
            id: element.id_admin,
            nome: element.nome,
            cpf: tratarCpf(element.cpf),
            role: element.role
          });
        }
        return res.status(200).json(arrayDados);
      } else {
        return res.status(404).json({ msg: "Nenhum usuário encontrado!" });
      }
    })
    .catch((error) => {
      return res.status(500).json({ msg: "Erro do servidor!" });
    });
}

async function deleteAdmin(req, res) {
  const { id } = req.params;
  try {
    const userExists = await database("admins").where({ id_admin: id }).first();
    if (!userExists) {
      return res.status(404).json({ msg: "Administrador não encontrado" });
    }

    await database("admins").where({ id_admin: id }).del();

    return res.status(200).json({ msg: "Administrador deletado com sucesso!" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

module.exports = {
  readUsers: readUsers,
  create: create,
  deleteUser: deleteUser,
  updateUser: updateUser,

  readAllPm: readAllPm,
  
  loginAdmin: loginAdmin,
  createAdmin: createAdmin,
  getAdmin: getAdmin,
  readAdmins:readAdmins,
  deleteAdmin: deleteAdmin
};
