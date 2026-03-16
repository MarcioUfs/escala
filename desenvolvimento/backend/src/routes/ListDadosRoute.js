const { Router } = require('express');
const listDados = require('../controllers/ListDadosController');
const router = new Router();

// router.get('/', async function (req, res) {
//     // const posts = await listDados.cabecalho();
//     // res.json(posts);
// });
router.get('/', async function (req, res) {
    const posts = await listDados.list();
    res.json(posts.rows);
});
router.get('/municipios', async function (req, res) {
    const posts = await listDados.municipios();
    res.json(posts.rows);
});
router.get('/bloco', async function (req, res) {
    const posts = await listDados.blocos();
    res.json(posts.rows);
});
router.get('/estadocad', async function (req, res) {
    const posts = await listDados.estcad();
    res.json(posts.rows);
});
router.get('/parente', async function (req, res){
    const posts = await listDados.parente();
    res.json(posts.rows);
})

module.exports = router;