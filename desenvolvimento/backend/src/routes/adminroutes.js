const express = require('express');
const verifyJWTAdmin = require('../middleware/verifyJWTAdmin');
const adminController = require('../controllers/adminController');
const AlmanaqueController = require('../controllers/AlmanaqueController');
// const { router } = require('./almanaqueroutes');

const router = express.Router();
// router.get('/', adminController.welcome);
// router.post('/deleteuser',verifyJWT,adminController.deleteUser);
// router.get('/getUser',verifyJWT,adminController.getUser);

/*************ADMIN USERS****************/
router.get('/allusers',verifyJWTAdmin,adminController.readUsers);
router.post('/sign-up', verifyJWTAdmin, adminController.create);
router.delete('/deleteuser/:id', verifyJWTAdmin, adminController.deleteUser);
router.put('/updateuser',verifyJWTAdmin,adminController.updateUser);

/*************ADMIN CRUD****************/
router.post('/login', adminController.loginAdmin);
router.post('/createadmin', verifyJWTAdmin, adminController.createAdmin);
router.get('/getadmin', verifyJWTAdmin, adminController.getAdmin);


// Rota para o robô de raspagem enviar o CSV (Pode ser protegida com um token específico depois)
router.post("/sync-almanaque", AlmanaqueController.syncAlmanaqueCsv);


// A organizar
// router.post('/confirm', verifyJWTAdmin, adminController.confirmAdmin );
// router.put('/updateMyUser/:id',verifyJWT,adminController.updateMyUser);
// router.post('/catchuser',verifyJWT,adminController.catchUser);

module.exports = router;