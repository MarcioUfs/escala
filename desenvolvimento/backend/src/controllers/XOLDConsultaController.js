// const database = require('../database/db');
// const pool = require('../database/database');

// const contar = async function (entrada) {
//     const r = entrada.body
//     // console.log(r)
//     let con = await database.select().table('estadocadastral').whereNotIn('codigo', ['2']).then(data => {
//         // console.log(data)
//         return data
//     }).catch(err => {
//         console.log(err)
//     })
//     // console.log(con)
//     return con
//     // const payload = pool.query(`SELECT * FROM estadocadastral WHERE '${descricao}' ~* '2'`)
//     // console.log((await payload).rows)
//     // return payload
// }

// module.exports = { contar }