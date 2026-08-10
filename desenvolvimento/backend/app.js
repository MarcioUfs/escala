const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

// Importação de Rotas e Serviços
const iniciarAgendamentos = require("./src/jobs/scheduler");
const { generalLimiter } = require("./src/middleware/rateLimiter");
const userRoute = require("./src/routes/userRoute");
const adminRoute = require("./src/routes/adminroutes");
const setorRoutes = require("./src/routes/setorroutes");
const v2EscalaRoutes = require("./src/routes/v2EscalaRoutes");

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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 1.4 Rate Limiter geral: protege toda a navegação básica do sistema
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

// ---------------------------------------------------
// 4. PROCESSOS EM SEGUNDO PLANO
// ---------------------------------------------------
// O scraper rodará independentemente das requisições web
iniciarAgendamentos();

module.exports = app;