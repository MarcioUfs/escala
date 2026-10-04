const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const database = require("../database/db");
const tratarCpf = require("../functions/tratarCpf");
const somenteCpf = require("../functions/somenteCpf");
const tratarMatricula = require("../functions/tratarMatricula");
const somenteMatricula = require("../functions/somenteMatricula");
const tratarTelefone = require("../functions/tratarTelefone");
const { senhaConfere } = require("../functions/compararCredencialLogin");

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
    const user = data[0];

    // Mesma mensagem e mesmo tempo de resposta pros três motivos de
    // recusa (CPF não existe, senha errada, conta desativada) — nenhum
    // deles pode ser diferenciado de fora, senão dá pra enumerar CPF
    // cadastrado e/ou saber que uma conta específica foi desativada.
    const senhaOk = await senhaConfere(user?.password, req.body.password);
    if (!user || !user.is_active || !senhaOk) {
      return res.status(401).json({ msg: "Credencial inválida!" });
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
    console.error("[userController]", error);
    return res.status(500).json({ msg: "Erro do servidor!" });
  }
}

async function getUser(req, res) {
  const { id_user } = req.user;

  try {
    // Antes usava .table(coluna1, coluna2, ...) -- knex ignora os argumentos
    // extras de .table() (só o 1º vale, como nome de tabela), então essa
    // lista toda de colunas nunca teve efeito: a query real virava um
    // `select *` puro. Com o LEFT JOIN, isso faz tbl_patentes.created_at/
    // updated_at sobrescreverem os de users (mesmo nome de coluna), e o
    // alias "AS ativo" nunca existia de fato -- data[0].ativo sempre vinha
    // undefined, então o status exibido era sempre "Inativo", usuário ativo
    // ou não. .select(...) de verdade corrige os dois problemas.
    const data = await database
      .select(
        "users.id_user",
        "users.email",
        "users.cpf",
        "users.nome",
        "users.matricula",
        "users.role",
        "users.telefone",
        "users.nome_guerra",
        "users.is_active as ativo",
        "users.updated_at",
        "users.must_change_password",
        "tbl_patentes.id_patente",
        "tbl_patentes.nome_patente",
        "tbl_patentes.sigla_patente",
      )
      .from("users")
      .where({ "users.id_user": id_user })
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
      // Front usa isso pra forçar a tela de troca de senha antes de
      // liberar o resto do painel (S4) -- fica true até a primeira troca.
      mustChangePassword: data[0].must_change_password,
    };

    return res.status(200).json(userData);
  } catch (error) {
    console.error("[userController]", error);
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

    // 4. Salva no banco -- troca aqui já conta como "primeira troca"
    // cumprida, então desliga o sinalizador que força essa tela (S4).
    await database.table("users").where({ id_user: userId }).update({
      password: hash,
      must_change_password: false,
      updated_at: new Date(),
    });

    return res.status(200).json({ msg: "Senha atualizada com sucesso!" });
  } catch (error) {
    console.error("[userController]", error);
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

module.exports = {
  login: login,
  getUser: getUser,
  updatePassword: updatePassword,
};
