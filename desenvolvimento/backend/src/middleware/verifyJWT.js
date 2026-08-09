const jwt = require('jsonwebtoken');

// 1. Verifica se o token é válido (Usuário está logado)
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

    // Use uma chave única para todos, ex: JWT_SECRET
    jwt.verify(token, process.env.SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ "msg": "Token inválido ou expirado! Realize novo login." });
        }
        
        // Salvamos os dados do token (id, role, etc) na requisição para as próximas etapas
        req.user = decoded; 
        next();
    });
}

// 2. Verifica se o usuário autenticado é um Usuário
function isUser(req, res, next) {
    // Como o verifyJwt roda antes, req.user já vai existir aqui
    if (req.user && req.user.role === 'user') {
        next(); // Tudo certo, ele é user. Pode continuar para a rota!
    } else {
        return res.status(403).send({ "msg": "Acesso negado. Ação restrita a usuários." });
    }
}

module.exports = { verifyJwt, isUser };