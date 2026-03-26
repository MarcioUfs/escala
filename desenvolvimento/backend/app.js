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

const app = express();

// ---------------------------------------------------
// 0. CONFIGURAÇÃO DE SEGURANÇA DE REDE
// ---------------------------------------------------
// Dinâmico: Garante o teste local sem falsos bloqueios 
// e aplica a segurança real (1) no servidor de produção.
const isProduction = process.env.NODE_ENV === "production";
app.set('trust proxy', isProduction ? 1 : 'loopback');

// ---------------------------------------------------
// 1. MIDDLEWARES GLOBAIS (Ordem Crítica de Segurança)
// ---------------------------------------------------

// 1.1 Helmet: Blinda os cabeçalhos HTTP contra ataques comuns logo na entrada
app.use(helmet());

// 1.2 CORS: Bloqueia requisições de sites não autorizados
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 1.3 Parsers de Body: Obrigatório vir ANTES das rotas.
// Sem isso, o `req.body.cpf` chegaria vazio no momento do login e 
// o sistema não conseguiria bloquear tentativas de força bruta.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ---------------------------------------------------
// 2. DOCUMENTAÇÃO
// ---------------------------------------------------
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// ---------------------------------------------------
// 3. ROTAS (Acoplamento e Versionamento)
// ---------------------------------------------------
// O generalLimiter protege toda a navegação básica do sistema
app.use("/", generalLimiter, userRoute);
app.use("/admin", generalLimiter, adminRoute);

// ---------------------------------------------------
// 4. PROCESSOS EM SEGUNDO PLANO
// ---------------------------------------------------
// O scraper rodará independentemente das requisições web
iniciarAgendamentos();

module.exports = app;