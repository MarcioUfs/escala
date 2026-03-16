import reader from './reader';
const connection = require('../database/database');
const list = require('./listDados');

const arquivo = __dirname + "../../.." + "/uploads/" + "arquivo.csv"
function init(arq) {
    reader(arq, 100, async (linha: string, cont: number) => {
        try {
            if (cont > 0) {
                // console.log("list",list,"linha",linha)
                await connection.query(`INSERT INTO pessoas ( ${list} ) VALUES (${linha})`)
            }
        } catch (e) {
            // console.log(`INSERT INTO pessoas ( ${list} ) VALUES (${linha})`)
            // console.log('oxi ' + (e as Error).message)
            // console.log(e.code, e)
        }
        // finally{
        //     if(cont%100000 === 0 ){
        //         console.log(cont)
        //     }
        //     if(cont >= 1225170 && cont < 1225200){
        //         console.log(cont)
        //     }
        // }
    })
    //tsc src/functions/reader.ts
}
module.exports = init