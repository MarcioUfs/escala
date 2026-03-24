const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const userController = require('../controllers/UserController');
const { strictLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login',strictLimiter, userController.login);
router.get('/getUser',verifyJWT,userController.getUser);
router.put('/updatePassword',strictLimiter,verifyJWT,userController.updatePassword);

module.exports = router;