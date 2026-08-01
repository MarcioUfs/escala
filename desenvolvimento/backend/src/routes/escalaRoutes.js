const express = require("express");
const modelos_escalas = require("../controllers/modelos_escalasController");
const {verifyJwt} = require("../middleware/verifyJWTAdmin");
// const modelo = require("../controllers/modelos_escalasController");

const router = express.Router();


// router.post("/modelo/create", verifyJwt, modelo.createModeloEscala);
// router.delete("/modelo/delete/:id", verifyJwt, modelo.deleteSoftModeloEscala);


/***********************************************/
// router.get("/modelos", verifyJwt, escalaController.listarModelosEscala);

// router.get("/guarnicoes", verifyJwt, escalaController.listarGuarnicoes);
// router.post("/guarnicoes", verifyJwt, escalaController.criarGuarnicao);

//*****************CRUD ESCALA********************* */
// router.post("/gerar", verifyJwt, escalaController.gerarEscala);
router.get("/read", verifyJwt, modelos_escalas.listarEscalas);
router.get("/getescala/:id", verifyJwt, modelos_escalas.getEscalaById);
router.delete("/delete/:id", verifyJwt, modelos_escalas.deleteEscala);
router.post("/create", verifyJwt, modelos_escalas.createEscala);
router.post("/guarnicoes", verifyJwt, modelos_escalas.listarEscalaGuarnicoes);

//
router.post("/guarnicao", verifyJwt, modelos_escalas.create_guarnicao);


module.exports = router;