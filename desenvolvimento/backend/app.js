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
const escalaRoutes = require("./src/routes/escalaRoutes");
const setorRoutes = require("./src/routes/setorroutes");
const guarnicaoRoutes = require("./src/routes/guarnicaoroutes");

const app = express();

// ---------------------------------------------------
// 0. CONFIGURAÇÃO DE SEGURANÇA DE REDE
// ---------------------------------------------------
// Dinâmico: Garante o teste local sem falsos bloqueios 
// e aplica a segurança real (1) no servidor de produção.
// const isProduction = process.env.NODE_ENV === "production";
// app.set('trust proxy', isProduction ? 1 : 'loopback');

// ---------------------------------------------------
// 1. MIDDLEWARES GLOBAIS (Ordem Crítica de Segurança)
// ---------------------------------------------------

// 1.1 Helmet: Blinda os cabeçalhos HTTP contra ataques comuns logo na entrada
app.use(helmet());

// 1.2 CORS: Bloqueia requisições de sites não autorizados
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    // origin: "*", // Permite todas as origens (ajuste conforme necessário)
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
app.use("/",  userRoute);
app.use("/admin",  adminRoute);
app.use("/escalas", escalaRoutes);
app.use("/setores", setorRoutes);
app.use("/guarnicoes", guarnicaoRoutes);


// ---------------------------------------------------
// 4. PROCESSOS EM SEGUNDO PLANO
// ---------------------------------------------------
// O scraper rodará independentemente das requisições web
iniciarAgendamentos();

module.exports = app;


// const express = require('express');
// const cors = require('cors');
// const app = express();
// // const sendFileRoute = require('./src/routes/sendFileRoute');
// // const dashBoardRoute = require('./src/routes/dashBoardRoute');
// // const searchRoute = require('./src/routes/searchRoute');
// // const tabuladorRoute = require('./src/routes/tabuladorRoute');
// // const listaDados = require('./src/routes/listDadosRoute');
// // const fichaRoute = require('./src/routes/fichaRoute');
// const userRoute = require('./src/routes/userRoute');
// const adminRoute = require('./src/routes/adminroutes');
// // const verifyJWT = require('./src/middleware/verifyJWT');

// app.use(express.urlencoded({ extended: false }))
// app.use(express.json())
// app.use(cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:3000",
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     // origin: "*",
//     // methods: "PUT,PATCH,POST,UPDATE,DELETE,GET"
// }));

// // app.use('/databases', verifyJWT, sendFileRoute);
// // app.use('/dashboard', verifyJWT, dashBoardRoute);
// // app.use('/search', verifyJWT, searchRoute);
// // app.use('/list', verifyJWT, listaDados);
// // app.use('/ficha', verifyJWT, fichaRoute);
// // app.use('/tabulador', verifyJWT, tabuladorRoute);
// app.use('/', userRoute);
// app.use('/admin', adminRoute);

// module.exports = app;
// // class App {
// //     constructor() {
// //         this.app = express();
// //         this.middlewares();
// //         this.routes();
// //     }
// //     middlewares() {
// //         this.app.use(express.urlencoded({ extended: true }));
// //         this.app.use(cors());
// //         this.app.use(express.json());
// //     }
// //     routes() {
// //         this.app.use('/upload', sendFileRoute);
// //         this.app.use('/dashboard', dashBoardRoute);
// //         this.app.use('/', dashBoardRoute);
// //         this.app.use('/search', dashBoardSearchRoute);
// //         this.app.use('/list', listaDados);
// //         this.app.use('/tabulador', tabuladorRoute);
// //         this.app.use('/', tabuladorRoute);
// //         this.app.use('/ficha',fichaRoute);
// //         this.app.use('/versaofinal',consultaRoute);
// //     }
// // }
// // module.exports = new App().app;
