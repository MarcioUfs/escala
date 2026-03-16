const { Router } = require('express');
const multer = require('multer');
const fileController = require('../controllers/SendFileController');
const multerConfig = require('../database/multerConfig');
const router = new Router();

const upload = multer(multerConfig);
router.post('/upload', upload.single('file'), fileController.store);
router.get('/show', fileController.show);
router.post('/delete', fileController.deletar);
module.exports = router;