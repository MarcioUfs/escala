const express = require("express");
const setorController = require("../controllers/setorController");
const {verifyJwt} = require("../middleware/verifyJWTAdmin");

const router = express.Router();

router.post("/create", verifyJwt, setorController.createSetor);
router.get("/read", verifyJwt, setorController.readSetores);
router.put("/update/:id", verifyJwt, setorController.updateSetor);
router.delete("/delete/:id", verifyJwt, setorController.deleteSetor);

module.exports = router;