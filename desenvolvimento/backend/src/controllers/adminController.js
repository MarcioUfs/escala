const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const database = require("../database/db");
const tratarCpf = require("../functions/tratarCpf");
const somenteCpf = require("../functions/somenteCpf");
const tratarMatricula = require("../functions/tratarMatricula");
const somenteMatricula = require("../functions/somenteMatricula");
const tratarTelefone = require("../functions/tratarTelefone");
const validarEmail = require("../functions/validarEmail");
const somenteTelefone = require("../functions/somenteTelefone");
const limparEspacos = require("../functions/limparEspacos");

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
      "users.nome_guerra",
      "users.is_active AS ativo",
      "users.updated_at",
      "tbl_patentes.id_patente",
      "tbl_patentes.nome_patente",
      "tbl_patentes.sigla_patente",
      "tbl_patentes.is_active AS patente_ativa",
      "tbl_patentes.created_at AS patente_criado_em",
      "tbl_patentes.updated_at AS patente_atualizado_em",
      "v2_grupamento.id_grupamento AS id_grupamento_atual",
      "v2_grupamento.sigla AS grupamento_atual",
    )
    .from("users")
    .leftJoin("tbl_patentes", "users.id_patente", "tbl_patentes.id_patente")
    // Vínculo mensal em aberto (data_fim IS NULL) — é essa a mesma condição
    // que vincularUsuarioGrupamentoV2 checa antes de rejeitar um novo
    // vínculo. Trazer aqui permite ao frontend já saber, antes de tentar
    // adicionar, que o militar está lotado em outro grupamento.
    .leftJoin("v2_grupamento_usuario", function () {
      this.on("v2_grupamento_usuario.fk_id_usuario", "=", "users.id_user").andOnNull(
        "v2_grupamento_usuario.data_fim",
      );
    })
    .leftJoin(
      "v2_grupamento",
      "v2_grupamento.id_grupamento",
      "v2_grupamento_usuario.fk_id_grupamento",
    )
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
            telefone: tratarTelefone(element.telefone),
            ativo: element.ativo ? "Ativo" : "Inativo",
            nome_guerra: element.nome_guerra || "Nome de Guerra não Cadastrado",
            id_patente: element.id_patente || "N/A",
            ordem: element.ordem || element.id_user,
            nome_patente: element.nome_patente || "N/A",
            sigla_patente: element.sigla_patente || "N/A",
            patente_ativa: element.patente_ativa ? "Ativa" : "Inativa",
            patente_criado_em: element.patente_criado_em || "01/01/1900",
            patente_atualizado_em:
              element.patente_atualizado_em || "01/01/1900",
            id_grupamento_atual: element.id_grupamento_atual || null,
            grupamento_atual: element.grupamento_atual || null,
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

async function createUser(req, res) {
  if (!req.body?.nome || req.body?.nome === "") {
    return res.status(400).json({ msg: "Nome é obrigatório!" });
  }
  if (!req.body?.nome_guerra || req.body?.nome_guerra === "") {
    return res.status(400).json({ msg: "Nome de guerra é obrigatório!" });
  }
  if (!req.body?.cpf || req.body?.cpf === "") {
    return res.status(400).json({ msg: "CPF é obrigatório!" });
  }
  if (!req.body?.password || req.body?.password === "") {
    return res.status(400).json({ msg: "Senha é obrigatória!" });
  }
  if (req.body?.password.length < 6) {
    return res
      .status(400)
      .json({ msg: "Senha deve ter pelo menos 6 caracteres!" });
  }
  if (somenteCpf(req.body?.cpf) === 0) {
    return res.status(400).json({ msg: "CPF inválido!" });
  }
  if (somenteMatricula(req.body?.matricula) === null) {
    return res.status(400).json({ msg: "Matrícula inválida!" });
  }
  if (somenteTelefone(req.body?.telefone) === 0) {
    return res.status(400).json({ msg: "Telefone inválido!" });
  }
  if (validarEmail(req.body?.email) === false) {
    return res.status(400).json({ msg: "Email inválido!" });
  }
  if(!Number.isInteger(Number(req.body?.id_patente))){
    return res.status(400).json({ msg: "Patente não é um número inteiro!" });
  }
  if(!req.body?.id_patente || req.body?.id_patente === ""){
    return res.status(400).json({ msg: "Patente é obrigatória!" });
  }
  if(req.body?.id_patente && isNaN(req.body?.id_patente)){
    return res.status(400).json({ msg: "Patente inválida!" });
  }
  if(req.body?.id_patente > 21 || req.body?.id_patente < 1){
    return res.status(400).json({ msg: "Patente fora do parametro!" });
  }
  
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
              id_patente: req.body.id_patente,
              cpf: somenteCpf(req.body.cpf),
              matricula: somenteMatricula(req.body.matricula),
              telefone: somenteTelefone(req.body.telefone),
              nome_guerra: req.body.nome_guerra,
              is_active: true,
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
  try {
    const { id } = req?.params;
    if (!id || id === "" || isNaN(id)) {
      return res.status(400).json({ msg: "ID é obrigatório!" });
    }
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

async function activeuser(req, res) {
  try {
    const { id, is_active } = req?.body;

    if (!id || id === "" || isNaN(id) || !("id" in req?.body)) {
      return res.status(400).json({ msg: "ID é obrigatório!", id: id });
    }

    if (!("is_active" in req?.body)) {
      return res
        .status(400)
        .json({ msg: "O atributo de verificação é obrigatório!" });
    }

    const userExists = await database("users").where({ id_user: id }).first();

    if (!userExists) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
    }

    await database("users")
      .where({ id_user: id })
      .update({ is_active: is_active, updated_at: new Date() });

    return res.status(200).json({
      msg: `Usuário ${is_active ? "ativado" : "desativado"} com sucesso!`,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

async function updateUser(req, res) {
  if (!req.body?.nome || req.body?.nome === "") {
    return res.status(400).json({ msg: "Nome é obrigatório!" });
  }
  if (!req.body?.nome_guerra || req.body?.nome_guerra === "") {
    return res.status(400).json({ msg: "Nome de guerra é obrigatório!" });
  }
  if (
    !req.body?.cpf ||
    req.body?.cpf === "" ||
    somenteCpf(req.body?.cpf) === 0
  ) {
    return res.status(400).json({ msg: "CPF é obrigatório!" });
  }
  // if (!req.body?.password || req.body?.password === "") {
  //   return res.status(400).json({ msg: "Senha é obrigatória!" });
  // }
  if (!req.body?.matricula || req.body?.matricula === "") {
    return res.status(400).json({ msg: "Matrícula é obrigatória!" });
  }
  if (
    !req.body?.telefone ||
    req.body?.telefone === "" ||
    somenteTelefone(req.body?.telefone) === 0
  ) {
    return res.status(400).json({ msg: "Telefone é obrigatório!" });
  }
  // if (req.body?.password.length < 6) {
  //   return res
  //     .status(400)
  //     .json({ msg: "Senha deve ter pelo menos 6 caracteres!" });
  // }
  if (req.body?.email && !validarEmail(req.body?.email)) {
    return res.status(400).json({ msg: "Email inválido!" });
  }

  const {
    id,
    nome,
    nome_guerra,
    cpf,
    email,
    // password,
    matricula,
    telefone,
    id_patente,
  } = req.body;

  // 1. Validações Iniciais
  if (!id || isNaN(id))
    return res.status(400).json({ msg: "ID inválido ou ausente" });
  if (
    !nome ||
    !cpf ||
    !email ||
    // !password ||
    !matricula ||
    !id_patente ||
    !nome_guerra ||
    !telefone
  ) {
    return res.status(400).json({ msg: "Dados incompletos!" });
  }
  //Higienização dos dados
  const emailOnly = email.trim().toLowerCase();
  const nomeOnly = limparEspacos(nome);
  const nomeGuerraOnly = limparEspacos(nome_guerra);
  const cpfOnly = somenteCpf(cpf);
  const matriculaOnly = somenteMatricula(matricula);
  const telefoneOnly = somenteTelefone(telefone);

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
        builder.where({ email: emailOnly });
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
    // const salt = await bcryptjs.genSalt(10);
    // const hash = await bcryptjs.hash(password, salt);

    // 5. Executar o Update
    await database("users")
      .where({ id_user: id })
      .update({
        email: emailOnly,
        // password: hash,
        nome: nomeOnly || "Nome não informado",
        id_patente: req.body.id_patente || null,
        cpf: cpfOnly,
        matricula: matriculaOnly,
        telefone: telefoneOnly || "(00) 00000-0000",
        nome_guerra: nomeGuerraOnly || "Nome de Guerra não Cadastrado",
        updated_at: new Date(),
      });

    return res.status(200).json({ msg: "Usuário atualizado com sucesso!" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

/*************LISTAR ALL****************/
// A sigla de patente vinda do raspador (efetivo_antiguidade.patente) nem
// sempre bate literalmente com tbl_patentes.sigla_patente — o raspador usa
// abreviações próprias da fonte original. Mapeamento manual só pros casos
// que checamos e realmente divergem; o resto cai no fallback (maiúsculas,
// sem espaço/hífen) e o que não bater fica null — o admin escolhe na mão,
// nunca adivinhamos errado silenciosamente.
const ALIAS_SIGLA_PATENTE_ANTIGUIDADE = {
  TC: "TEN-CEL",
  "CAD 1º": "CAD-1º",
  "SD 1ª CL": "SD-1ª",
  "SD 2ª CL": "SD-2ª",
  "SD 3ª CL": "SD-3ª",
};

function normalizarSiglaPatente(sigla) {
  return (sigla || "").toUpperCase().replace(/[\s-]/g, "");
}

function sugerirPatente(siglaAntiguidade, listaPatentes) {
  const siglaEquivalente = ALIAS_SIGLA_PATENTE_ANTIGUIDADE[siglaAntiguidade] || siglaAntiguidade;
  const alvo = normalizarSiglaPatente(siglaEquivalente);
  return (
    listaPatentes.find((p) => normalizarSiglaPatente(p.sigla_patente) === alvo) || null
  );
}

// GET /admin/allpm?busca=termo — pré-cadastro a partir da lista de
// antiguidade. Busca por nome, matrícula ou CPF; exclui quem já tem
// cadastro em `users` (é pré-cadastro de gente NOVA, não duplicidade); e
// sugere a patente correspondente (sem travar o campo — o admin sempre
// pode trocar no formulário).
async function readAllPm(req, res) {
  try {
    const busca = limparEspacos((req.query.busca || "").toString());

    if (busca.length < 2) {
      return res.status(400).json({ msg: "Informe pelo menos 2 caracteres para buscar" });
    }

    const buscaDigitos = busca.replace(/\D/g, "");

    const resultados = await database("efetivo_antiguidade")
      .select(
        "efetivo_antiguidade.id",
        "efetivo_antiguidade.nome",
        "efetivo_antiguidade.matricula",
        "efetivo_antiguidade.cpf",
        "efetivo_antiguidade.patente",
        "efetivo_antiguidade.quadro",
      )
      .leftJoin("users", "users.cpf", "efetivo_antiguidade.cpf")
      .whereNull("users.id_user")
      .andWhere(function () {
        this.whereRaw("LOWER(efetivo_antiguidade.nome) LIKE ?", [`%${busca.toLowerCase()}%`]);
        if (buscaDigitos) {
          this.orWhereRaw("REPLACE(efetivo_antiguidade.matricula, '-', '') LIKE ?", [
            `%${buscaDigitos}%`,
          ]).orWhere("efetivo_antiguidade.cpf", "like", `%${buscaDigitos}%`);
        }
      })
      .orderBy("efetivo_antiguidade.nome")
      .limit(15);

    const listaPatentes = await database("tbl_patentes").select("id_patente", "sigla_patente");

    const arrayDados = resultados.map((element) => {
      const patenteSugerida = sugerirPatente(element.patente, listaPatentes);
      return {
        id: element.id,
        nome: element.nome,
        matricula: tratarMatricula(element.matricula),
        cpf: tratarCpf(element.cpf),
        patente_sigla_origem: element.patente,
        quadro: element.quadro,
        id_patente_sugerido: patenteSugerida?.id_patente || null,
      };
    });

    return res.status(200).json(arrayDados);
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

async function readAllPatente(req, res) {
  await database
    .select("*")
    .from("tbl_patentes")
    .then((data) => {
      const arrayDados = [];
      if (data.length > 0) {
        for (let element of data) {
          arrayDados.push({
            id_patente: element.id_patente,
            nome_patente: element.nome_patente,
            sigla_patente: element.sigla_patente,
            is_active: element.is_active,
          });
        }
        return res.status(200).json(arrayDados);
      } else {
        return res.status(404).json({ msg: "Nenhum dado encontrado!" });
      }
    })
    .catch((error) => {
      return res.status(500).json({ msg: "Erro do servidor!" });
    });
}

/*************ADMIN CRUD****************/
function loginAdmin(req, res) {
  if (!req.body?.cpf || req.body?.cpf === "") {
    return res.status(400).json({ msg: "CPF é obrigatório!" });
  }
  if (!req.body?.password || req.body?.password === "") {
    return res.status(400).json({ msg: "Senha é obrigatória!" });
  }

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
        return res.status(401).send({ msg: "Usuário não encontrado!" });
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
  if (!req.body?.nome || req.body?.nome === "") {
    return res.status(400).json({ msg: "Nome é obrigatório!" });
  }
  if (!req.body?.cpf || req.body?.cpf === "") {
    return res.status(400).json({ msg: "CPF é obrigatório!" });
  }
  if (!req.body?.password || req.body?.password === "") {
    return res.status(400).json({ msg: "Senha é obrigatória!" });
  }
  if (req.body?.password.length < 6) {
    return res
      .status(400)
      .json({ msg: "Senha deve ter pelo menos 6 caracteres!" });
  }

  if (somenteCpf(req.body?.cpf) === 0) {
    return res.status(400).json({ msg: "CPF inválido!" });
  }

  await database
    .select()
    .table("admins")
    .where({ cpf: somenteCpf(req.body.cpf) })
    .then((data) => {
      if (data.length >= 1) {
        return res.status(409).json({ msg: "CPF já cadastrado!" });
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

async function getAdmin(req, res) {
  const { id_admin } = req.user;
  await database
    .select("id_admin", "nome", "cpf", "role")
    .table("admins")
    .where({ id_admin: id_admin })
    .then((data) => {
      if (data.length <= 0) {
        return res.status(404).send({ msg: "Administrador não encontrado" });
      } else {
        const userData = {
          id: data[0].id_admin,
          nome: data[0].nome,
          cpf: tratarCpf(data[0].cpf),
          role: data[0].role,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at,
        };
        return res.status(200).send(userData);
      }
    })
    .catch((error) => {
      return res.status(500).json({ msg: `Erro do servidor ${error}` });
    });
}

async function allAdmins(req, res) {
  await database
    .select("id_admin", "nome", "cpf", "role", "created_at", "updated_at")
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
            role: element.role,
            created_at: element.created_at,
            updated_at: element.updated_at,
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
  try {
    const { id } = req?.params;
    if (!id || id === "" || isNaN(id)) {
      return res.status(400).json({ msg: "ID é obrigatório!" });
    }
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

async function updateAdmin(req, res) {
  // 1. Validações Iniciais
  if (!req.body?.id || req.body?.id === "" || isNaN(req.body?.id)) {
    return res.status(400).json({ msg: "ID é obrigatório!" });
  }
  if (!req.body?.nome || req.body?.nome === "") {
    return res.status(400).json({ msg: "Nome é obrigatório!" });
  }
  if (!req.body?.cpf || req.body?.cpf === "") {
    return res.status(400).json({ msg: "CPF é obrigatório!" });
  }
  if (somenteCpf(req.body?.cpf) === 0) {
    return res.status(400).json({ msg: "CPF inválido!" });
  }
  //Destructuring dos dados do corpo da requisição
  const { id, nome, cpf } = req.body;
  //Higienização do CPF para apenas números
  const cpfOnly = somenteCpf(cpf);

  try {
    // 2. Verificar se o usuário que será editado existe
    const userToUpdate = await database("admins")
      .where({ id_admin: id })
      .first();
    if (!userToUpdate) {
      return res.status(404).json({ msg: "Administrador não encontrado" });
    }

    // 3. Verificar se os novos dados (CPF) já pertencem a OUTRO administrador
    const conflictCPF = await database("admins")
      .where((builder) => {
        builder.where({ cpf: cpfOnly });
      })
      .andWhereNot({ id_admin: id }) // Ignora o próprio usuário que está sendo editado
      .first();

    if (conflictCPF) {
      return res.status(409).json({ msg: "CPF já cadastrado em outra conta!" });
    }

    // 4. Executar o Update
    await database("admins")
      .where({ id_admin: id })
      .update({
        nome: nome || "Nome não informado",
        cpf: cpfOnly,
        updated_at: new Date(),
      });

    return res
      .status(200)
      .json({ msg: "Administrador atualizado com sucesso!" });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

module.exports = {
  readUsers: readUsers,
  createUser: createUser,
  deleteUser: deleteUser,
  activeuser: activeuser,
  updateUser: updateUser,

  readAllPm: readAllPm,
  readAllPatente: readAllPatente,

  loginAdmin: loginAdmin,
  createAdmin: createAdmin,
  getAdmin: getAdmin,
  allAdmins: allAdmins,
  deleteAdmin: deleteAdmin,
  updateAdmin: updateAdmin,
};
