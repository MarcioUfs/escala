const express = require("express");
const setorController = require("../controllers/setorController");
const {verifyJwt} = require("../middleware/verifyJWTAdmin");

const router = express.Router();

router.post("/create", verifyJwt, setorController.createSetor);
router.get("/read", verifyJwt, setorController.readSetores);
router.put("/update", verifyJwt, setorController.updateSetor);
router.delete("/delete/:id", verifyJwt, setorController.deleteSetor);
router.post("/active", verifyJwt, setorController.activeSetor);

module.exports = router;