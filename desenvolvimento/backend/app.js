const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // Recomendação de segurança
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

// Importação de Rotas e Serviços
const iniciarAgendamentos = require("./src/jobs/scheduler");
const { generalLimiter } = require("./src/middleware/rateLimiter");
const userRoute = require("./src/routes/userRoute");
const adminRoute = require("./src/routes/adminroutes");

const app = express();

// Avisa o Express que ele está atrás de um proxy e deve ler o IP real do usuário
app.set('trust proxy', 1);

// ---------------------------------------------------
// 1. MIDDLEWARES GLOBAIS (Devem vir antes das rotas)
// ---------------------------------------------------

// Helmet ajuda a proteger o Express configurando cabeçalhos HTTP de segurança
app.use(helmet());

// Configuração estrita do CORS
app.use(
  cors({
    // Em produção, troque "*" pela URL exata do seu frontend React
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Parsers do corpo da requisição
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ---------------------------------------------------
// 2. DOCUMENTAÇÃO
// ---------------------------------------------------
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// ---------------------------------------------------
// 3. ROTAS (Acoplamento e Versionamento)
// ---------------------------------------------------
// Prefixar rotas é uma boa prática para evitar conflitos e facilitar futuras versões
app.use("/", generalLimiter, userRoute);
app.use("/admin", generalLimiter, adminRoute);

// ---------------------------------------------------
// 4. PROCESSOS EM SEGUNDO PLANO
// ---------------------------------------------------
iniciarAgendamentos();

module.exports = app;
