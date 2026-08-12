require("dotenv").config();
const axios = require("axios");
const https = require("https");

// Conexão com o banco via Knex
const db = require("../database/db.js");

// A conexão usa Let's Encrypt (cadeia ISRG Root X2 -> YE2), uma CA pública
// já confiável por padrão no Node — não precisa de nenhuma configuração
// especial de certificado. O agent aqui só existe caso seja necessário
// ajustar outras opções de conexão (keepAlive, etc.) no futuro.
const agent = new https.Agent({});

const BASE_URL = "https://intranet.pm.se.gov.br";

// -----------------------------------------------------------------------
// Login confirmado via HTML do form real:
// <form id="formLogin" action="login" method="post"> servido em
// /portal/index — "login" é relativo, resolve pra /portal/login.
// -----------------------------------------------------------------------
const LOGIN_URL = `${BASE_URL}/portal/login`;
const CAMPO_LOGIN = "login";
const CAMPO_SENHA = "senha";

const URL_LISTA = `${BASE_URL}/portal/policialAntiguidadeFiltrar`;

function extrairCookies(respostaHttp) {
  const cookies = respostaHttp.headers["set-cookie"];
  return cookies ? cookies.map((c) => c.split(";")[0]) : [];
}

// Junta cookies de várias respostas num único header "Cookie", sem
// duplicar o mesmo nome (o mais recente sempre vence).
function mesclarCookies(...listasDeCookies) {
  const mapa = new Map();
  for (const lista of listasDeCookies) {
    for (const par of lista) {
      const nome = par.split("=")[0];
      mapa.set(nome, par);
    }
  }
  return Array.from(mapa.values()).join("; ");
}

async function autenticar() {
  // Passo 1: visita a tela de login pra receber o(s) cookie(s) inicial(is)
  // — JSESSIONID e possivelmente um token CSRF. Apps Java/Servlet
  // costumam criar a sessão já na primeira visita — o login só marca
  // essa sessão como autenticada, não cria uma nova.
  const respostaIndex = await axios.get(`${BASE_URL}/portal/index`, {
    httpsAgent: agent,
    timeout: 15000,
  });

  const cookiesIndex = extrairCookies(respostaIndex);
  if (cookiesIndex.length === 0) {
    console.error("[scraperAntiguidade] Não recebeu nenhum cookie na página inicial.");
    return null;
  }

  // Passo 2: envia usuário/senha usando os cookies da primeira visita.
  const dadosLogin = new URLSearchParams({
    [CAMPO_LOGIN]: process.env.PMSE_USER,
    [CAMPO_SENHA]: process.env.PMSE_PASS,
  });

  const respostaLogin = await axios.post(LOGIN_URL, dadosLogin, {
    httpsAgent: agent,
    timeout: 15000,
    maxRedirects: 0,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: mesclarCookies(cookiesIndex),
    },
    validateStatus: (status) => status >= 200 && status < 400,
  });

  // Acumula os cookies das duas etapas (não substitui) — se o login
  // trocar só o JSESSIONID mas o site ainda esperar um cookie que só
  // apareceu na primeira visita, ele continua presente.
  const cookiesLogin = extrairCookies(respostaLogin);
  return {
    cookie: mesclarCookies(cookiesIndex, cookiesLogin),
    statusLogin: respostaLogin.status,
  };
}

async function rasparListaAntiguidade() {
  try {
    if (!process.env.PMSE_USER || !process.env.PMSE_PASS) {
      console.error(
        "[scraperAntiguidade] PMSE_USER e/ou PMSE_PASS não definidos nas variáveis de ambiente. Abortando antes de tentar logar.",
      );
      return false;
    }

    console.log("[scraperAntiguidade] Autenticando...");
    const autenticacao = await autenticar();

    if (!autenticacao) {
      console.error("[scraperAntiguidade] Falha no login: sem cookie de sessão.");
      return false;
    }

    const { cookie, statusLogin } = autenticacao;
    console.log(`[scraperAntiguidade] Resposta do login: status ${statusLogin}. Buscando lista completa de antiguidade...`);

    // length: -1 já devolve TODOS os registros numa chamada só — não
    // precisa de loop de paginação (confirmado: recordsFiltered ===
    // recordsTotal quando enviado dessa forma).
    const payload = new URLSearchParams({
      draw: "1",
      start: "0",
      length: "-1",
      "patente.id": "",
      "quadro.id": "",
    });

    const respostaLista = await axios.post(URL_LISTA, payload, {
      httpsAgent: agent,
      timeout: 30000, // lista inteira é pesada (5000+ registros), timeout maior
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
      },
    });

    const linhas = respostaLista.data?.data;

    if (!Array.isArray(linhas)) {
      // Loga status, content-type e início do corpo — útil se o site
      // mudar de novo no futuro (ex: sessão expirada devolve a página de
      // login em HTML em vez do JSON esperado).
      const corpo =
        typeof respostaLista.data === "string"
          ? respostaLista.data.slice(0, 300)
          : JSON.stringify(respostaLista.data).slice(0, 300);
      console.error(
        "[scraperAntiguidade] Resposta em formato inesperado — sem 'data' como array.",
        `\nStatus: ${respostaLista.status}`,
        `\nContent-Type: ${respostaLista.headers["content-type"]}`,
        `\nInício do corpo: ${corpo}`,
      );
      return false;
    }

    console.log(`[scraperAntiguidade] ${linhas.length} registros recebidos (total no site: ${respostaLista.data.recordsTotal}).`);

    if (linhas.length !== respostaLista.data.recordsTotal) {
      console.warn(
        `[scraperAntiguidade] Atenção: quantidade recebida (${linhas.length}) difere do total informado pelo site (${respostaLista.data.recordsTotal}). Possível truncamento na paginação — sincronização prosseguindo mesmo assim, mas vale investigar se isso persistir.`,
      );
    }

    if (linhas.length === 0) {
      console.log("[scraperAntiguidade] Nenhum dado para salvar.");
      return false;
    }

    // Mapeia os campos abreviados da API pro schema do banco.
    // "ordem" (número da posição, ex: 1, 2, 3...) alimenta tanto a coluna
    // "ordem" quanto "antiguidade" — por pedido explícito, antiguidade
    // deve ser o mesmo número exibido na 1ª coluna da lista, não o campo
    // "anti" separado que a API também retorna.
    // cpf e data_admissao exigem a migration
    // 20260812010000_add_cpf_admissao_antiguidade.js rodada antes.
    //
    // ?? null normaliza undefined/string vazia — confirmado na prática
    // que "tempo_promocao" pode vir ausente (militar recém-admitido,
    // ainda sem promoção). Ver migration
    // 20260812020000_relaxar_colunas_antiguidade.js, que torna essas
    // colunas opcionais no banco.
    const listaMapeada = linhas.map((linha) => ({
      matricula: linha.matr,
      nome: linha.nome,
      patente: linha.pate ?? null,
      quadro: linha.quad ?? null,
      ordem: linha.ordem,
      antiguidade: linha.ordem != null ? String(linha.ordem) : null,
      data_promocao: linha.prom ?? null,
      tempo_promocao: linha.temp ?? null,
      cpf: linha.cpf ?? null,
      data_admissao: linha.admi ?? null,
    }));

    // Matrícula é a chave de dedupe — sem ela, registros diferentes
    // colidiriam silenciosamente no Map abaixo. Filtra e avisa em vez de
    // deixar isso passar despercebido.
    const semMatricula = listaMapeada.filter((p) => !p.matricula);
    if (semMatricula.length > 0) {
      console.warn(
        `[scraperAntiguidade] ${semMatricula.length} registro(s) sem matrícula foram descartados:`,
        semMatricula.map((p) => p.nome).join(", "),
      );
    }

    // Filtra matrículas únicas (mesma lógica de antes, por segurança —
    // a API pode não garantir unicidade)
    const listaSemDuplicatas = Array.from(
      new Map(
        listaMapeada.filter((p) => p.matricula).map((p) => [p.matricula, p]),
      ).values(),
    );

    console.log(`[scraperAntiguidade] ${listaSemDuplicatas.length} matrículas únicas. Salvando no banco...`);

    const agora = new Date();
    const listaComTimestamp = listaSemDuplicatas.map((p) => ({
      ...p,
      atualizado_em: agora,
    }));

    await db("efetivo_antiguidade")
      .insert(listaComTimestamp)
      .onConflict("matricula")
      .merge();

    console.log("[scraperAntiguidade] Sucesso! Banco de dados sincronizado.");
    return true;
  } catch (erro) {
    console.error("[scraperAntiguidade] Falha na raspagem:", erro.message);
    return false;
  }
}

module.exports = rasparListaAntiguidade;