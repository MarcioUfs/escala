const { Router } = require('express');
const dashBoardController = require('../controllers/DashBoardController');
const router = new Router();

// router.post('/', async function (req, res) {
//     let envio = {}
//     const entrada = req.body
//     console.log(entrada)
//     const posts = await dashBoardController.index(entrada);
//     envio.rowCo = posts.rowCount
//     envio.row = posts.rows
//     if(posts.rowCount > 0){
//         envio.dif = posts.rowCount
//     }else{
//         envio.dif = 0
//     }
//     // console.log(envio);
//     res.json(envio);
// });
router.post('/busca', async function (req, res) {
    const entrada = req.body
    const posts = await dashBoardController.busca(entrada);
    res.json(posts.rows);
});
router.get('/municipios', async function (req, res) {
    const posts = await dashBoardController.municipios();
    res.json(posts.rows);
});
router.post('/contar', async function (req, res) {
    const entrada = req.body
    const posts = await dashBoardController.contar(entrada);
    res.json(posts.rows);
});
module.exports = router;