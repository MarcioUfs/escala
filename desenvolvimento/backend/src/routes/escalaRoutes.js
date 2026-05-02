const express = require("express");
const modelos_escalas = require("../controllers/modelos_escalasController");
// const {verifyJwt} = require("../middleware/verifyJWTAdmin");
// const modelo = require("../controllers/modelos_escalasController");

const router = express.Router();


// router.post("/modelo/create", verifyJwt, modelo.createModeloEscala);
// router.delete("/modelo/delete/:id", verifyJwt, modelo.deleteSoftModeloEscala);


/***********************************************/
// router.get("/modelos", verifyJwt, escalaController.listarModelosEscala);

// router.get("/guarnicoes", verifyJwt, escalaController.listarGuarnicoes);
// router.post("/guarnicoes", verifyJwt, escalaController.criarGuarnicao);

// router.post("/gerar", verifyJwt, escalaController.gerarEscala);
router.get("/listar", modelos_escalas.listarEscalas);
router.get("/listar/:id", modelos_escalas.getEscalaById);


//
router.post("/guarnicao", modelos_escalas.create_guarnicao);

module.exports = router;