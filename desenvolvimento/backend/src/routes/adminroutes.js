const express = require('express');
const {verifyJwt, isAdmin} = require('../middleware/verifyJWTAdmin');
const adminController = require('../controllers/adminController');
const { strictLimiter, authenticatedLimiter } = require('../middleware/rateLimiter');
const uploadCsvAntiguidade = require('../middleware/uploadCsvAntiguidade');
const avisosController = require('../controllers/avisosController');
const router = express.Router();

// Ordem dos middlewares: verifyJwt (está logado?) -> isAdmin (tem
// permissão?) -> authenticatedLimiter (não está abusando da API?). Checar
// a permissão antes do rate limit evita gastar cota de quem nem deveria
// estar ali.

/*************ADMIN USERS****************/
router.get('/allusers', verifyJwt, isAdmin, authenticatedLimiter, adminController.readUsers);
router.post('/createuser', verifyJwt, isAdmin, authenticatedLimiter, adminController.createUser);
router.delete('/deleteuser/:id', verifyJwt, isAdmin, authenticatedLimiter, adminController.deleteUser);
router.put('/updateuser', verifyJwt, isAdmin, authenticatedLimiter, adminController.updateUser);
router.post('/activeuser', verifyJwt, isAdmin, authenticatedLimiter, adminController.activeuser);

/***********LISTAR************/
router.get('/allpm', verifyJwt, isAdmin, authenticatedLimiter, adminController.readAllPm);
router.get('/allpatentes', verifyJwt, isAdmin, authenticatedLimiter, adminController.readAllPatente);

/*************AVISOS (MURAL DO PAINEL)****************/
// Leitura para usuários comuns fica em userroutes.js (GET /avisos), pois
// usuário e admin usam segredos de JWT diferentes.
router.get('/avisos', verifyJwt, isAdmin, authenticatedLimiter, avisosController.avisoAtual);
router.get('/avisos/historico', verifyJwt, isAdmin, authenticatedLimiter, avisosController.historico);
router.post('/avisos', verifyJwt, isAdmin, authenticatedLimiter, avisosController.publicar);

/*************ANTIGUIDADE (IMPORTAÇÃO MANUAL)****************/
router.post(
  '/antiguidade/importar-csv',
  verifyJwt,
  isAdmin,
  authenticatedLimiter,
  uploadCsvAntiguidade,
  adminController.importarAntiguidadeCsv,
);

/*************ADMIN CRUD****************/
router.post('/login', strictLimiter, adminController.loginAdmin);

router.post('/createadmin', verifyJwt, isAdmin, authenticatedLimiter, adminController.createAdmin);
router.get('/getadmin', verifyJwt, isAdmin, authenticatedLimiter, adminController.getAdmin);
// strictLimiter (10/h) porque aqui dá pra tentar adivinhar a senha atual
// com um token roubado.
router.put('/updatePassword', verifyJwt, isAdmin, strictLimiter, adminController.updateAdminPassword);
router.get('/alladmins', verifyJwt, isAdmin, authenticatedLimiter, adminController.allAdmins);
router.delete('/deleteadmin/:id', verifyJwt, isAdmin, authenticatedLimiter, adminController.deleteAdmin);
router.put('/updateadmin', verifyJwt, isAdmin, authenticatedLimiter, adminController.updateAdmin);

module.exports = router;