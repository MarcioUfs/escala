const express = require('express');
const {verifyJwt, isAdmin} = require('../middleware/verifyJWTAdmin');
const adminController = require('../controllers/adminController');
const { strictLimiter, authenticatedLimiter } = require('../middleware/rateLimiter');
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

/*************ADMIN CRUD****************/
router.post('/login', strictLimiter, adminController.loginAdmin);

router.post('/createadmin', verifyJwt, isAdmin, authenticatedLimiter, adminController.createAdmin);
router.get('/getadmin', verifyJwt, isAdmin, authenticatedLimiter, adminController.getAdmin);
router.get('/alladmins', verifyJwt, isAdmin, authenticatedLimiter, adminController.allAdmins);
router.delete('/deleteadmin/:id', verifyJwt, isAdmin, authenticatedLimiter, adminController.deleteAdmin);
router.put('/updateadmin', verifyJwt, isAdmin, authenticatedLimiter, adminController.updateAdmin);

module.exports = router;