const express = require('express');
const verifyJWTAdmin = require('../middleware/verifyJWTAdmin');
const verifyJWT = require('../middleware/verifyJWT');
const userController = require('../controllers/UserController');

const router = express.Router();
// router.get('/', userController.welcome);
// router.post('/sign-up', userController.create);
router.post('/login', userController.login);
// router.post('/deleteuser',verifyJWT,userController.deleteUser);
// router.put('/updateuser/:id',verifyJWT,userController.updateUser);

router.get('/getUser',verifyJWT,userController.getUser);

// A organizar
// router.post('/confirm', verifyJWTAdmin, userController.confirmAdmin );
// router.get('/allusers',verifyJWT,userController.allUsers);
// router.put('/updateMyUser/:id',verifyJWT,userController.updateMyUser);
// router.post('/catchuser',verifyJWT,userController.catchUser);

module.exports = router;