const database = require("../database/db");

const LIMITE_CARACTERES = 2000;
const LIMITE_HISTORICO_PADRAO = 20;
const LIMITE_HISTORICO_MAXIMO = 100;

function formatarAviso(linha) {
  return {
    id: linha.id_aviso,
    texto: linha.texto,
    nome_admin: linha.nome_admin,
    created_at: linha.created_at,
  };
}

// Aviso vigente = publicação mais recente. Texto vazio significa "aviso
// retirado" (ver migration) e é devolvido como ausente.
async function buscarVigente() {
  const linha = await database("avisos").orderBy("id_aviso", "desc").first();
  if (!linha || linha.texto.trim() === "") return null;
  return formatarAviso(linha);
}

// GET /avisos (usuário) e GET /admin/avisos (admin) — mesma resposta, só
// muda o middleware de autenticação de cada rota.
async function avisoAtual(req, res) {
  try {
    return res.status(200).json({ aviso: await buscarVigente() });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// GET /admin/avisos/historico?limite=20
async function historico(req, res) {
  try {
    const pedido = Number.parseInt(req.query.limite, 10);
    const limite = Number.isInteger(pedido)
      ? Math.min(Math.max(pedido, 1), LIMITE_HISTORICO_MAXIMO)
      : LIMITE_HISTORICO_PADRAO;

    const linhas = await database("avisos").orderBy("id_aviso", "desc").limit(limite);
    return res.status(200).json(linhas.map(formatarAviso));
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

// POST /admin/avisos — publica um novo aviso (ou retira o atual, se o
// texto vier vazio). O autor é sempre o admin do token.
async function publicar(req, res) {
  const { texto } = req.body || {};

  if (typeof texto !== "string") {
    return res.status(400).json({ msg: "O texto do aviso é obrigatório." });
  }

  // Remove caracteres de controle (menos quebra de linha e tab) e
  // normaliza quebras de linha do Windows.
  const textoLimpo = texto
    .replace(/\r\n?/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();

  if (textoLimpo.length > LIMITE_CARACTERES) {
    return res
      .status(400)
      .json({ msg: `O aviso pode ter no máximo ${LIMITE_CARACTERES} caracteres.` });
  }

  const idAdmin = req.user?.id_admin;
  if (!idAdmin) {
    return res.status(401).json({ msg: "Acesso negado. Administrador não autenticado." });
  }

  try {
    const admin = await database("admins").select("id_admin", "nome").where({ id_admin: idAdmin }).first();
    if (!admin) {
      return res.status(404).json({ msg: "Administrador não encontrado." });
    }

    const [novo] = await database("avisos")
      .insert({
        texto: textoLimpo,
        fk_id_admin: admin.id_admin,
        nome_admin: admin.nome,
        created_at: new Date(),
      })
      .returning("*");

    return res.status(201).json({
      msg: textoLimpo === "" ? "Aviso retirado." : "Aviso publicado com sucesso!",
      aviso: textoLimpo === "" ? null : formatarAviso(novo),
    });
  } catch (error) {
    return res.status(500).json({ msg: "Erro interno do servidor" });
  }
}

module.exports = { avisoAtual, historico, publicar };
