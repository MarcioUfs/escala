const express = require('express');
const {verifyJwt, isAdmin} = require('../middleware/verifyJWTAdmin');
const adminController = require('../controllers/adminController');
const { strictLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

/*************ADMIN USERS****************/
router.get('/allusers', verifyJwt, isAdmin, adminController.readUsers);
router.post('/createuser', verifyJwt, isAdmin, adminController.createUser); 
router.delete('/deleteuser/:id', verifyJwt, isAdmin, adminController.deleteUser);
router.put('/updateuser', verifyJwt, isAdmin, adminController.updateUser);
router.post('/activeuser', verifyJwt, isAdmin, adminController.activeuser);

/***********LISTAR************/
router.get('/allpm', verifyJwt, isAdmin, adminController.readAllPm);
router.get('/allpatentes', verifyJwt, isAdmin, adminController.readAllPatente);

/*************ADMIN CRUD****************/
router.post('/login', strictLimiter, adminController.loginAdmin); 

router.post('/createadmin', verifyJwt, isAdmin, adminController.createAdmin); 
router.get('/getadmin', verifyJwt, isAdmin, adminController.getAdmin);
router.get('/alladmins', verifyJwt, isAdmin, adminController.allAdmins);
router.delete('/deleteadmin/:id', verifyJwt, isAdmin, adminController.deleteAdmin);
router.put('/updateadmin', verifyJwt, isAdmin, adminController.updateAdmin);

module.exports = router;