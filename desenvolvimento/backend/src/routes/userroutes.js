const express = require("express");
const { verifyJwt, isUser } = require("../middleware/verifyJWT");
const userController = require("../controllers/UserController");
const { strictLimiter, authenticatedLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// /login não tem verifyJwt (ninguém está logado ainda) — strictLimiter
// sozinho já protege contra força bruta aqui.
router.post("/login", strictLimiter, userController.login);

// Ordem: verifyJwt (está logado?) -> isUser (tem permissão?) ->
// authenticatedLimiter (não está abusando da API?) — mesmo padrão
// aplicado em admin/escalas.
router.get("/getUser", verifyJwt, isUser, authenticatedLimiter, userController.getUser);

// Troca de senha é sensível o bastante pra manter o strictLimiter (10
// tentativas/hora) em vez do authenticatedLimiter genérico — protege
// contra alguém com token válido tentando adivinhar a senha antiga por
// força bruta via este endpoint.
router.put("/updatePassword", verifyJwt, isUser, strictLimiter, userController.updatePassword);

module.exports = router;
