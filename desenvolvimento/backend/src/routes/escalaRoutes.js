const express = require("express");
const verifyJWTAdmin = require("../middleware/verifyJWTAdmin");
const escalaController = require("../controllers/escalaController");

const router = express.Router();

router.get("/modelos", verifyJWTAdmin, escalaController.listarModelosEscala);

router.get("/guarnicoes", verifyJWTAdmin, escalaController.listarGuarnicoes);
router.post("/guarnicoes", verifyJWTAdmin, escalaController.criarGuarnicao);

router.post("/gerar", verifyJWTAdmin, escalaController.gerarEscala);

module.exports = router;