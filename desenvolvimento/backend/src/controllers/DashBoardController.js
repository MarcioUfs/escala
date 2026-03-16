const pool = require('../database/database');

const busca = function (entrada) {
    const payload = pool.query(`SELECT * FROM pessoas WHERE ${entrada.busca} ~* '${entrada.busca1}' LIMIT ${entrada.limit} OFFSET(${entrada.pageNumber - 1}*100)`)
    return payload
}

const contar = function (entrada) {
    const payload = pool.query(`SELECT COUNT(*) FROM pessoas WHERE ${entrada.busca} ~* '${entrada.busca1}'`)
    return payload
}
const municipios = function () {
    const payload = pool.query(`SELECT codigo_municipio_completo, nome_municipio, nome_mesorregiao, dcd_ibge, pnom_pessoa FROM pessoas INNER JOIN municipios ON (pessoas.dcd_ibge = municipios.codigo_municipio_completo) ORDER BY nome_municipio;`);
    return payload
}
module.exports = {
    busca,
    municipios,
    contar
}