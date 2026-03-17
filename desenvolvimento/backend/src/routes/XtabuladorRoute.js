// const { Router } = require('express');
const express = require('express');
// const tabuladorController = require('../tabulador/controllers/TabuladorController');
const tabuladorController = require('../controllers/tabulador/TabuladorController');
const router = express.Router();
router.post('/', tabuladorController.tabulador)
router.post('/totalresult', tabuladorController.totalresult)
// router.post('/newTab', tabuladorController.newTabulador)
router.post('/newTab', async function (req, res) {
    // const entrada = req.body;
    const posts = await tabuladorController.nova2(req.body);
    res.json(posts);
});
module.exports = router;