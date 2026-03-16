const pool = require('../database/database');

const search = function (entrada) {
    const payload = pool.query(`SELECT * FROM pessoas WHERE ${entrada.busca} ~* '${entrada.busca1}' LIMIT ${entrada.limit} OFFSET(${entrada.pageNumber - 1}*100)`)
    return payload
}

module.exports = { search }