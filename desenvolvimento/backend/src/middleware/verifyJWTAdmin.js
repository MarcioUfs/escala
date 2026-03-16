const jwt = require('jsonwebtoken');
function verifyJwt(req, res, next) {    
        if (!req.headers.authorization) {
            return res.status(401).send({ "msg": "Não autorizado, Token inexistente" })
        }
        const splitTokenB = req.headers.authorization.split(' ')
        const tokenB = splitTokenB[1]
        jwt.verify(tokenB, process.env.SECRET_ADMIN, function (err, decoded) {
            if (err) {
                return res.status(403).send({ "msg": "Token expirado! realize novo login" })
            }
            req.decodedData = decoded;
            next();
        })
}
module.exports = verifyJwt;