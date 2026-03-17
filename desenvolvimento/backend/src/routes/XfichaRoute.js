const { Router } = require('express');
const fichaController = require('../controllers/FichaController');
const router = new Router();

router.get('/:id', async function (req, res) {
    const entrada = req.params;
    const posts = await fichaController.ficha(entrada);
    res.json(posts.rows);
});
// router.post('/espec', async function (req, res) {
//     const entrada = req.body;
//     const posts = await fichaController.fichaEspecifica(entrada);
//     res.json(posts.rows);
// });
router.post('/especrefcad', async function (req, res) {
    const entrada = req.body;
    const posts = await fichaController.fichaEspecificaRefCad(entrada);
    res.json(posts.rows);
});
module.exports = router;