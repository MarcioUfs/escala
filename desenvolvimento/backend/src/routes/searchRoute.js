const { Router } = require('express');
const searchController = require('../controllers/SearchController');
const router = new Router();

router.post('/', async function (req, res) {
    const entrada = req.body;
    // console.log(JSON.stringify(entrada, null, 2))
    // const posts1 = await dashBoardController.contar(entrada);
    const posts = await searchController.search(entrada);
    
    // console.log(posts)
    res.json(posts.rows);
});
// router.get('/totalResult', async function (req, res) {
//     // const entrada = req.body;
//     const posts = await dashBoardController.totalResult();
//     res.json(posts);
// });
module.exports = router;