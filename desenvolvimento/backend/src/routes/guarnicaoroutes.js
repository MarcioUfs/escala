const express = require("express");
const guarnicaoController = require("../controllers/guarnicaoController");
const {verifyJwt} = require("../middleware/verifyJWTAdmin");

const router = express.Router();

router.post("/create", verifyJwt, guarnicaoController.createGuarnicao);
// router.get("/read", verifyJwt, guarnicaoController.readGuarnicao);
// router.put("/update", verifyJwt, guarnicaoController.updateGuarnicao);
// router.delete("/delete/:id", verifyJwt, guarnicaoController.deleteGuarnicao);
// router.post("/active", verifyJwt, guarnicaoController.activeGuarnicao);

module.exports = router;