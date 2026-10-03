const jwt = require("jsonwebtoken");

// Middleware do perfil MASTER — mesma estrutura de verifyJWT (usuário) e
// verifyJWTAdmin, só que com segredo próprio (SECRET_MASTER).
//
// O segredo é separado de propósito: se o SECRET_ADMIN vazar, ninguém
// consegue forjar um token de master com ele. São níveis distintos de
// poder, então são chaves distintas.

function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ msg: "Não autorizado. Token inexistente.", tokenError: true });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).send({ msg: "Token mal formatado.", tokenError: true });
  }

  jwt.verify(parts[1], process.env.SECRET_MASTER, function (err, decoded) {
    if (err) {
      // 401 (não 403): autenticação, não autorização — ver explicação em
      // verifyJWT.js. tokenError:true é o sinal que o front usa pra
      // encerrar a sessão automaticamente.
      return res.status(401).send({ msg: "Token inválido ou expirado! Realize novo login.", tokenError: true });
    }
    req.user = decoded;
    next();
  });
}

function isMaster(req, res, next) {
  if (req.user && req.user.role === "master") {
    return next();
  }
  return res.status(403).send({ msg: "Acesso negado. Ação restrita ao perfil master." });
}

module.exports = { verifyJwt, isMaster };
