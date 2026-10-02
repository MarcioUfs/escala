const jwt = require('jsonwebtoken');

// 1. Verifica se o token é válido (Usuário está logado)
//
// Aceita DOIS segredos: o de administrador e o de master. O master executa
// as mesmas ações do admin, e são ~40 rotas administrativas — duplicá-las
// sob /master seria inviável, então o token dele é reconhecido aqui e o
// isAdmin abaixo o deixa passar. Cada perfil continua com a sua própria
// chave: um token de admin nunca vira token de master, e vice-versa.
function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ "msg": "Não autorizado. Token inexistente." });
    }

    // Boa prática: verificar se o token segue o padrão "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).send({ "msg": "Token mal formatado." });
    }

    const token = parts[1];

    // Tenta primeiro o segredo de admin (caso mais comum) e, se não bater,
    // o de master. Só depois de os dois falharem é que o token é rejeitado.
    jwt.verify(token, process.env.SECRET_ADMIN, function (err, decoded) {
        if (!err) {
            req.user = decoded;
            return next();
        }

        jwt.verify(token, process.env.SECRET_MASTER, function (errMaster, decodedMaster) {
            if (errMaster) {
                return res.status(403).send({ "msg": "Token inválido ou expirado! Realize novo login." });
            }
            req.user = decodedMaster;
            return next();
        });
    });
}

// 2. Verifica se o usuário autenticado é um Administrador (ou Master)
//
// O master é um super-administrador: tudo que o admin faz, ele faz. Por isso
// passa por aqui também — inclusive nas rotas administrativas criadas no
// futuro, sem precisar lembrar de liberá-lo uma a uma.
function isAdmin(req, res, next) {
    // Como o verifyJwt roda antes, req.user já vai existir aqui
    if (req.user && (req.user.role === 'admin' || req.user.role === 'master')) {
        next(); // Tudo certo, ele é admin (ou master). Pode continuar para a rota!
    } else {
        return res.status(403).send({ "msg": "Acesso negado. Ação restrita a administradores." });
    }
}

module.exports = { verifyJwt, isAdmin };
