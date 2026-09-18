const multer = require("multer");

// Armazenamento em memória: o arquivo nunca toca o disco, evitando risco
// de path traversal/execução via nome de arquivo malicioso e mantendo o
// upload volátil (só existe durante a validação/import da requisição).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    // Checagem de extensão só descarta de cara o caso óbvio (upload
    // errado por engano). O mimetype enviado pelo cliente não é
    // confiável (fácil de falsificar) e por isso não é usado aqui — a
    // validação de verdade acontece em cima do conteúdo já recebido, em
    // validarCsvAntiguidade.
    if (!/\.csv$/i.test(file.originalname || "")) {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "arquivo"));
    }
    cb(null, true);
  },
});

function uploadCsvAntiguidade(req, res, next) {
  upload.single("arquivo")(req, res, (erro) => {
    if (erro instanceof multer.MulterError) {
      if (erro.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ msg: "Arquivo maior que o limite permitido de 5MB." });
      }
      return res.status(400).json({ msg: "Apenas arquivos .csv são aceitos." });
    }
    if (erro) {
      return res.status(400).json({ msg: "Falha ao processar o arquivo enviado." });
    }
    next();
  });
}

module.exports = uploadCsvAntiguidade;
