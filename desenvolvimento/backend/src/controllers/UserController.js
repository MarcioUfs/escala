const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const database = require("../database/db");
const tratarCpf = require("../functions/tratarCpf");
const somenteCpf = require("../functions/somenteCpf");
const tratarMatricula = require("../functions/tratarMatricula");
const somenteMatricula = require("../functions/somenteMatricula");

function login(req, res) {
  let cpfOnly = somenteCpf(req.body.cpf);
  if (cpfOnly === 0) {
    return res.status(401).send({ msg: "Credencial inválida!" });
  }
  database
    .select()
    .table("users")
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
                  id_user: data[0].id_user,
                  // matricula: data[0].matricula,
                  // cpf: data[0].cpf,
                  role: data[0].role,
                },
                process.env.SECRET,
                { expiresIn: "6h" },
                function (err, token) {
                  return res.status(200).json({
                    msg: "Autenticação com sucesso!",
                    id: data[0].id_user,
                    role: data[0].role,
                    // nome: data[0].nome,
                    // cpf: tratarCpf(data[0].cpf),
                    // matricula: tratarMatricula(data[0].matricula),
                    tokenUser: token,
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
      // console.log(error)
      // console.log({ "msg": "Erro do servidor!", "erro":`"${error}"` })
      return res.status(500).json({ msg: "Erro do servidor!" });
    });
}

async function getUser(req, res) {
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "Token inválido ou expirado" });
    } else {
      await database
        .table("users")
        .where({ id_user: decoded.id_user })
        .then((data) => {
          if (data.length <= 0) {
            return res.status(404).send({ msg: "Usuário não encontrado" });
          } else {
            const userData = {
              nome: data[0].nome,
              cpf: tratarCpf(data[0].cpf),
              email: data[0].email,
              matricula: tratarMatricula(data[0].matricula),
              id: data[0].id_user,
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


//SEM USO AINDA
async function updateMyUser(req, res) {
  if (isNaN(req.params.id)) {
    return res.status(404).send({ msg: "Usuário não encontrado" });
  }

  // Verifica se os campos obrigatórios estão preenchidos
  if (!req.body.nome || !req.body.cpf || !req.body.email) {
    return res.status(403).send({ msg: "Dados incompletos!" });
  }

  const user = {
    email: req.body.email,
    cpf: req.body.cpf,
    nome: req.body.nome,
  };

  try {
    // Atualiza os dados do usuário no banco de dados
    await database
      .table("users")
      .where({ id_user: req.params.id })
      .update(user)
      .then((data) => {
        if (data === 0) {
          return res.status(404).send({ msg: "Usuário não encontrado" });
        } else {
          return res.status(200).json({ msg: "Atualizado com sucesso!" });
        }
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ msg: "Erro interno do servidor" });
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

async function catchUser(req, res) {
  await database
    .table("users")
    .where({ id_user: req.body.id })
    .then((data) => {
      if (data.length <= 0) {
        return res.status(404).send({ msg: "Usuário não encontrado" });
      } else {
        let result = JSON.parse(`{
                "nome":"${data[0].nome}",
                "cpf":"${data[0].cpf}",
                "email":"${data[0].email}",
                "role":"${data[0].role}",
                "id":"${data[0].id_user}"
            }`);
        return res.status(200).send(result);
      }
    })
    .catch((error) => {
      return res.status(500).json({ msg: `"Erro do servidor ${error}"` });
    });
}


module.exports = {
  login: login,
  getUser: getUser,
  updateMyUser: updateMyUser,
  catchUser: catchUser,
};
