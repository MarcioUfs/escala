const pool = require('../database/database');

function drop() {
    try {
        return pool.query(`DROP TABLE pessoas;`);
    } catch (error) {
        console.log(`Erro tryDrop ${error}`)
    }
}
module.exports =  drop;