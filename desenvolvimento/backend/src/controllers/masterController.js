const jwt = require("jsonwebtoken");
const database = require("../database/db");
const tratarCpf = require("../functions/tratarCpf");
const somenteCpf = require("../functions/somenteCpf");
const { senhaConfere } = require("../functions/compararCredencialLogin");

// -----------------------------------------------------------------------
// Perfil MASTER — super-administrador.
//
// Faz tudo que o administrador faz (o isAdmin em verifyJWTAdmin aceita o
// token dele) e, além disso, administra os próprios administradores pelas
// rotas de /admin, que continuam disponíveis para ambos os perfis.
//
// Este controller cuida só do que é exclusivo do master: autenticar e
// devolver o próprio perfil. A rota não é divulgada em nenhum botão do
// painel — mas quem protege é o login, não o endereço secreto.
// -----------------------------------------------------------------------

async function loginMaster(req, res) {
  try {
    if (!req.body?.cpf || req.body?.cpf === "") {
      return res.status(400).json({ msg: "CPF é obrigatório!" });
    }
    if (!req.body?.password || req.body?.password === "") {
      return res.status(400).json({ msg: "Senha é obrigatória!" });
    }

    const cpfOnly = somenteCpf(req.body.cpf);
    if (cpfOnly === 0) {
      return res.status(401).json({ msg: "Credencial inválida!" });
    }

    const master = await database("masters").where({ cpf: cpfOnly }).first();

    // Mesma resposta e mesmo tempo de resposta pros três motivos de
    // recusa (CPF não existe, senha errada, conta desativada) — dizer
    // qual deles falhou entregaria de graça informação sobre a conta.
    // O bcrypt.compare roda sempre (contra o hash real ou o fictício),
    // nunca só quando o master existe — senão o tempo de resposta
    // sozinho já denunciaria quais CPFs são de master.
    const senhaOk = await senhaConfere(master?.password, req.body.password);
    if (!master || !master.is_active || !senhaOk) {
      return res.status(401).json({ msg: "Credencial inválida!" });
    }

    const token = jwt.sign(
      { id_master: master.id_master, role: master.role },
      process.env.SECRET_MASTER,
      { expiresIn: "6h" },
    );

    return res.status(200).json({
      msg: "Autenticação com sucesso!",
      id: master.id_master,
      nome: master.nome,
      role: master.role,
      token,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Erro do servidor!" });
  }
}

// GET /master/me — perfil do master autenticado (nome para o cabeçalho da
// tela, e confirmação de que o token ainda vale).
async function getMaster(req, res) {
  try {
    const master = await database("masters")
      .select("id_master", "nome", "cpf", "role")
      .where({ id_master: req.user.id_master })
      .first();

    if (!master) {
      return res.status(404).json({ msg: "Master não encontrado" });
    }

    return res.status(200).json({
      id: master.id_master,
      nome: master.nome,
      cpf: tratarCpf(master.cpf),
      role: master.role,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

module.exports = { loginMaster, getMaster };
