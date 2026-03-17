const pool = require('../database/database');
// const database = require('../database/db');
const ficha = function (entrada) {
    const payload = pool.query(`SELECT * FROM pessoas WHERE id = ${entrada.id}`)
    return payload
}

const fichaEspecificaRefCad = function (entrada) {
    let splitRefCad = entrada.refCad.substring(0, entrada.refCad.length - 3)
    const payload = pool.query(`SELECT * FROM pessoas WHERE dcod_familiar_fam = '${entrada.code_fam}' AND pref_cad ILIKE '${splitRefCad}%'`)
    return payload

}
module.exports = {
    ficha,
    fichaEspecificaRefCad
}