const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

// Importação de Rotas e Serviços
const iniciarAgendamentos = require("./src/jobs/scheduler");
const { generalLimiter } = require("./src/middleware/rateLimiter");
const userRoute = require("./src/routes/userroutes");
const adminRoute = require("./src/routes/adminroutes");
const setorRoutes = require("./src/routes/setorroutes");
const v2EscalaRoutes = require("./src/routes/v2EscalaRoutes");
const v2EscalaUserRoutes = require("./src/routes/v2EscalaUserRoutes");
const v2PermutaRoutes = require("./src/routes/v2PermutaRoutes");

const app = express();

// ---------------------------------------------------
// 0. CONFIGURAÇÃO DE SEGURANÇA DE REDE
// ---------------------------------------------------
// Dinâmico: Garante o teste local sem falsos bloqueios
// e aplica a segurança real (1) no servidor de produção.
// Necessário no Render (está atrás de um proxy reverso) para que
// o express-rate-limit e req.ip identifiquem o IP real do cliente.
const isProduction = process.env.NODE_ENV === "production";
app.set("trust proxy", isProduction ? 1 : "loopback");

// ---------------------------------------------------
// 1. MIDDLEWARES GLOBAIS (Ordem Crítica de Segurança)
// ---------------------------------------------------

// 1.1 Helmet: Blinda os cabeçalhos HTTP contra ataques comuns logo na entrada
app.use(helmet());

// 1.2 CORS: Bloqueia requisições de sites não autorizados
// Lista de origens permitidas: produção + ambientes de desenvolvimento local.
// FRONTEND_URL é opcional, útil para adicionar uma origem extra via variável
// de ambiente sem precisar mexer no código (ex: ambiente de staging).
const allowedOrigins = [
  "https://e-escala.onrender.com", // produção
  "http://localhost:5173", // dev local (Vite)
  "http://192.168.56.1:5173", // dev local via IP de rede
  process.env.FRONTEND_URL, // extra, configurável via .env
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requisições sem "origin" (ex: Postman, apps mobile, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Não autorizado pelo CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 1.3 Parsers de Body: Obrigatório vir ANTES das rotas.
// Sem isso, o `req.body.cpf` chegaria vazio no momento do login e
// o sistema não conseguiria bloquear tentativas de força bruta.
// Limite explícito de tamanho (1mb) evita que um payload gigante sirva
// como vetor simples de negação de serviço.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// 1.4 Rate Limiter geral: protege toda a navegação básica do sistema.
// Funciona em camada com os limiters específicos de cada rota
// (authenticatedLimiter, strictLimiter) — este aqui é o teto por IP,
// os outros são o teto por usuário/ação. As duas camadas são
// intencionais: uma protege a capacidade geral do servidor, a outra
// protege contra abuso de uma conta específica.
app.use(generalLimiter);

// ---------------------------------------------------
// 2. DOCUMENTAÇÃO
// ---------------------------------------------------
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// ---------------------------------------------------
// 3. ROTAS (Acoplamento e Versionamento)
// ---------------------------------------------------
app.use("/", userRoute);
app.use("/admin", adminRoute);
app.use("/setores", setorRoutes);
app.use("/escalas", v2EscalaRoutes);
app.use("/minha-escala", v2EscalaUserRoutes);
app.use("/permutas", v2PermutaRoutes);

// ---------------------------------------------------
// 4. ROTA NÃO ENCONTRADA (404)
// ---------------------------------------------------
// Sem isso, uma URL inexistente cai no handler padrão do Express (HTML,
// "Cannot GET /..."), inconsistente com o resto da API, que sempre
// responde em JSON.
app.use((req, res) => {
  res.status(404).json({ msg: "Rota não encontrada" });
});

// const rasparListaAntiguidade = require("./src/services/scraperAntiguidade");
// rasparListaAntiguidade().then((sucesso) => console.log("Resultado:", sucesso));

// ---------------------------------------------------
// 5. HANDLER DE ERRO GLOBAL
// ---------------------------------------------------
// Precisa ser o ÚLTIMO app.use e ter exatamente 4 parâmetros (err, req,
// res, next) — é assim que o Express reconhece um error handler.
// Sem isso, qualquer erro não tratado (incluindo o `callback(new
// Error(...))` do CORS acima) cai no handler padrão do Express, que em
// desenvolvimento devolve o stack trace completo pro cliente — vazando
// caminho de arquivos, nomes de função e versão de dependências.
app.use((err, req, res, next) => {
  if (err.message === "Não autorizado pelo CORS") {
    return res.status(403).json({ msg: "Origem não autorizada." });
  }

  console.error(err); // loga o erro real só no servidor, nunca no cliente

  return res.status(500).json({ msg: "Erro interno do servidor." });
});

// ---------------------------------------------------
// 6. PROCESSOS EM SEGUNDO PLANO
// ---------------------------------------------------
// O scraper rodará independentemente das requisições web.
// Não roda em ambiente de teste, pra não disparar jobs reais (envio de
// notificação, geração de escala, etc.) toda vez que os testes importam
// este arquivo.
if (process.env.NODE_ENV !== "test") {
  iniciarAgendamentos();
}

module.exports = app;