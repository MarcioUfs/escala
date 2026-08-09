const express = require("express");
const { verifyJwt, isUser } = require("../middleware/verifyJWT");
const userController = require("../controllers/UserController");
const { strictLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/login", strictLimiter, userController.login);
router.get("/getUser", verifyJwt, isUser, userController.getUser);
router.put("/updatePassword",strictLimiter,verifyJwt,isUser,userController.updatePassword);

module.exports = router;
