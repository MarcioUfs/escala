const express = require("express");
const setorController = require("../controllers/setorController");
const { verifyJwt, isAdmin } = require("../middleware/verifyJWTAdmin");
const { authenticatedLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Mesma cadeia do restante do painel: verifyJwt (está logado?) -> isAdmin
// (tem permissão?) -> authenticatedLimiter (não está abusando da API?).
// Antes faltavam os dois últimos aqui — só neste arquivo.

router.post("/create", verifyJwt, isAdmin, authenticatedLimiter, setorController.createSetor);
router.get("/read", verifyJwt, isAdmin, authenticatedLimiter, setorController.readSetores);
router.put("/update", verifyJwt, isAdmin, authenticatedLimiter, setorController.updateSetor);
router.delete("/delete/:id", verifyJwt, isAdmin, authenticatedLimiter, setorController.deleteSetor);
router.post("/active", verifyJwt, isAdmin, authenticatedLimiter, setorController.activeSetor);

module.exports = router;
