const express = require("express");
const {verifyJwt} = require("../middleware/verifyJWTAdmin");
const escalaController = require("../controllers/escalaController");

const router = express.Router();

router.get("/modelos", verifyJwt, escalaController.listarModelosEscala);

router.get("/guarnicoes", verifyJwt, escalaController.listarGuarnicoes);
router.post("/guarnicoes", verifyJwt, escalaController.criarGuarnicao);

router.post("/gerar", verifyJwt, escalaController.gerarEscala);

module.exports = router;