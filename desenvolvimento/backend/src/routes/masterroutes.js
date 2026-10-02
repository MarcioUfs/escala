const express = require("express");
const masterController = require("../controllers/masterController");
const { verifyJwt, isMaster } = require("../middleware/verifyJWTMaster");
const { strictLimiter, authenticatedLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// -----------------------------------------------------------------------
// Rotas EXCLUSIVAS do perfil master.
//
// A gestão de administradores não está aqui: ela já existe em /admin
// (createadmin, alladmins, updateadmin, deleteadmin) e o token de master
// passa no isAdmin daquelas rotas. Duplicá-las aqui seria manter duas
// versões da mesma regra.
//
// Mesma cadeia do resto do projeto: verifyJwt -> isMaster -> limitador.
// O login usa strictLimiter (10/h por CPF) porque é alvo de força bruta.
// -----------------------------------------------------------------------

router.post("/login", strictLimiter, masterController.loginMaster);
router.get("/me", verifyJwt, isMaster, authenticatedLimiter, masterController.getMaster);

module.exports = router;
