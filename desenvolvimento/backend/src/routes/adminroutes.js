const express = require('express');
const verifyJWTAdmin = require('../middleware/verifyJWTAdmin');
const adminController = require('../controllers/adminController');

const router = express.Router();

/*************ADMIN USERS****************/
router.get('/allusers',verifyJWTAdmin,adminController.readUsers);
router.post('/sign-up', verifyJWTAdmin, adminController.create);
router.delete('/deleteuser/:id', verifyJWTAdmin, adminController.deleteUser);
router.put('/updateuser',verifyJWTAdmin,adminController.updateUser);

/***********LISTAR TODOS OS PM************/
router.get('/allpm', verifyJWTAdmin, adminController.readAllPm);

/*************ADMIN CRUD****************/
router.post('/login', adminController.loginAdmin);
router.post('/createadmin', verifyJWTAdmin, adminController.createAdmin);
router.get('/getadmin', verifyJWTAdmin, adminController.getAdmin);


module.exports = router;