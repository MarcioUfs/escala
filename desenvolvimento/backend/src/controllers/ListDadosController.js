const pool = require('../database/database');

const list = function () {
    return pool.query(`SELECT * FROM listaDados;`);
}
const municipios = function () {
    return pool.query(`SELECT * FROM municipios;`);
}
const blocos = function () {
    return pool.query(`SELECT * FROM bloco;`);
}
const estcad = function () {
    return pool.query(`SELECT * FROM estadocadastral`)
}
const parente = function () {
    return pool.query(`SELECT * FROM parentesco`)
}

module.exports = { list, municipios, blocos, estcad, parente }
