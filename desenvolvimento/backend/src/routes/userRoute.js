const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const userController = require('../controllers/UserController');

const router = express.Router();

router.post('/login', userController.login);
router.get('/getUser',verifyJWT,userController.getUser);

module.exports = router;