const express = require('express');
const cors = require('cors');
const app = express();
// Importa o nosso novo agendador
const iniciarAgendamentos = require('./src/jobs/scheduler');
// const sendFileRoute = require('./src/routes/sendFileRoute');
// const dashBoardRoute = require('./src/routes/dashBoardRoute');
// const searchRoute = require('./src/routes/searchRoute');
// const tabuladorRoute = require('./src/routes/tabuladorRoute');
// const listaDados = require('./src/routes/listDadosRoute');
// const fichaRoute = require('./src/routes/fichaRoute');
const userRoute = require('./src/routes/userRoute');
const adminRoute = require('./src/routes/adminroutes');
// const verifyJWT = require('./src/middleware/verifyJWT');

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors({
    origin: "*",
    methods: "PUT,PATCH,POST,UPDATE,DELETE,GET"
}));

// Liga os agendamentos automáticos em segundo plano
iniciarAgendamentos();

// app.use('/databases', verifyJWT, sendFileRoute);
// app.use('/dashboard', verifyJWT, dashBoardRoute);
// app.use('/search', verifyJWT, searchRoute);
// app.use('/list', verifyJWT, listaDados);
// app.use('/ficha', verifyJWT, fichaRoute);
// app.use('/tabulador', verifyJWT, tabuladorRoute);
app.use('/', userRoute);
app.use('/admin', adminRoute);

module.exports = app;
// class App {
//     constructor() {
//         this.app = express();
//         this.middlewares();
//         this.routes();
//     }
//     middlewares() {
//         this.app.use(express.urlencoded({ extended: true }));
//         this.app.use(cors());
//         this.app.use(express.json());
//     }
//     routes() {
//         this.app.use('/upload', sendFileRoute);
//         this.app.use('/dashboard', dashBoardRoute);
//         this.app.use('/', dashBoardRoute);
//         this.app.use('/search', dashBoardSearchRoute);
//         this.app.use('/list', listaDados);
//         this.app.use('/tabulador', tabuladorRoute);
//         this.app.use('/', tabuladorRoute);
//         this.app.use('/ficha',fichaRoute);
//         this.app.use('/versaofinal',consultaRoute);
//     }
// }
// module.exports = new App().app;