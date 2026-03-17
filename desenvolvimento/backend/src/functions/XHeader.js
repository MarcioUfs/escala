const fs = require('fs');
const readline = require('readline');
const { once } = require('events');
const connection = require('../database/database');

const arquivo = __dirname + "../../.." + "/uploads/" + "arquivo.csv"
// let header = ''
// let linhas = ''
// let contador = 0;
// const info = {
//     "linhas": ""
// }
// const limit = 10;
// async function pushData() {
//     try {
//         const rl = readline.createInterface({
//             input: fs.createReadStream(arquivo),
//             // output: process.stdout,
//             // terminal: false
//         })

//         rl.on('line', execute)
//         console.log('oi')
//         rl.on('pause', myFunction)
//         rl.pause()              
//         console.log('tchau')

//         function myFunction() {
//             console.log('sistema pausado')
//             // setTimeout(function(){ rl.on('line', execute); }, 1000);

//         }
//         rl.on('end', finishWork)
//         // setTimeout(()=>{rl.on('resume', execute)}, 5000);
//         function finishWork() {
//             console.log('Done!');
//             (async () => {
//                 // await connection.connect()
//                 await connection.end()
//             })()
//             rl.close();
//         }
//         function foreachLine(line) {

//             const result = line.split(';')
//             let into = result.map(e => {
//                 const entra = e.replace('\'', '').trim()
//                 return `'${entra}'`

//             })
//             // linhas += `${result.join(',')}`
//             linhas = into.join(',')
//             // console.log(linhas)
//         }
//         // async function onLimit() {
//         //     // console.log(linhas)
//         //     /*
//         //     INSERT INTO pessoas (col1, col2, ... coln)
//         //     VALUES () () ()
//         //     VALUER (), (), ();

//         //     */
//         //     await connection.query(`
//         //         INSERT INTO pessoas (${header})
//         //         VALUES ${linhas};
//         //     `)
//         //     linhas = ""
//         // }
//         (async () => {
//             await connection.connect()
//             // await connection.end()
//         })()
//         async function execute(line) {

//             try {
//                 if (contador === 0) {
//                     const result = line.split(';')
//                     let into = result.map(e => {
//                         return (e.replace('.', '').trim())
//                     })

//                     header = into.join(',')
//                 } else {
//                     // await connection.connect()
//                     foreachLine(line)
//                     async function onLimit() {
//                         // if(contador % limit === 0)
//                         console.log(linhas)
//                         try {
//                             await connection.query(`
//                         INSERT INTO pessoas (${header})
//                         VALUES (${linhas});
//                     `)
//                             linhas = '';
//                         } catch (error) {
//                             console.log(error)
//                         }
//                         // await connection.end()
//                     }
//                     onLimit()
//                     // console.log(typeof(header))
//                     // console.log(typeof(linhas))
//                     // console.log(line)
//                     // if (contador % limit === 0) {
//                     // console.log(contador)
//                     // onLimit()
//                     // }
//                 }
//                 contador++;
//             } catch (error) {
//                 console.log(error)
//             }
//         }
//         await once(rl, 'close');

//         console.log('File processed.');
//     } catch (error) {
//         console.error(error);
//     }
// }
// ***********************
// let fila_tam = 0;
// let fila_limit  = 100;
// let sqlCommand = "";
// let rl = readline.createInterface({
//     input: fs.createReadStream(arquivo),
//     // output: process.stdout,
//     // terminal: false
// })
// function init(){
//     observe(rl, 10 )
//     rl.on('line', execute);

// }
// function observe(rl, time){
//     setTimeout(
//         ()=>{
//             if(haVagas()){
//                 rl.resume();
//             }
//             else{
//                 rl.pause();
//             }
//         },
//         time
//     )
// }
// function haVagas(){
//     return fila_tam < fila_limit
// }
// function execute(line){
//     fila_tam++
//     if(haVagas()){
//         acumular(line)
//     }
//     //atingiu o limit
//     else{
//         armazenarRegistros(sqlCommand);
//     }
// }
// function acumular (line){
//     console.log(line);
//     const result = line.split(';')
//     let into = result.map(e => {
//         const entra = e.replace('\'', '').trim()
//         return `'${entra}'`

//     })
//     sqlCommand += into.join(',')
// }
// function armazenarRegistros(Pessoas){
//     try{
//         //TO DO
//         console.log(Pessoas)
//     }catch(e){
//         console.log(e.error)
//         //TO DO
//     }
//     finally{
//         sqlCommand = "55"
//         fila_tam--
//     }
// }

// module.exports = init
// *********************

// const fs = require('fs');
// const arquivo = __dirname + "../../.." + "/uploads/" + "arquivo.csv"
// var stream = fs.createReadStream(arquivo);
// stream.on('data', onData).buffer = '';
// let cont = 0
// function onLine(line, cb) {
//     setTimeout(function () {
//         cont++
//         if(cont%10000==0)
//             console.log(cont++);
//         cb();
//     }, 1);
// }

// function onData(chunk) {
//     var i, hasData = Buffer.isBuffer(chunk);
//     if (hasData) {
//         stream.buffer += chunk.toString('utf8');
//         if (stream.paused)
//             return;
//     }
//     if ((i = stream.buffer.indexOf('\n')) > -1) {
//         var line = stream.buffer.substring(0, i);
//         stream.buffer = stream.buffer.substring(i + 1);
//         stream.pause();
//         stream.paused = true;
//         onLine(line, onData);
//     } else if (!hasData) {
//         stream.resume();
//         stream.paused = false;
//     }
// }

// module.exports = onData;


//***************** */
// const { once } = require('events');
// const { createInterface } = require('readline');
// const { createReadStream } = require('fs');
// (async function processLineByLine() {
//     try {
//         const rl = createInterface({
//             input: createReadStream(arquivo),
//             crlfDelay: Infinity
//         });

//         rl.on('line', (line) => {
//             // Process the line.
//             const linhas = line.split('\r\n').join('')
//             const linhas1 = linhas.split(';')
//             let into = linhas1.map(e => {
//                 return (e.replace(/[']|[.]/g, '').trim())
//             })
//             // const joinar = into.join(',')
//             // const quebra = joinar.split('\n')
//             line = into
//             console.log((line))
//         });

//         await once(rl, 'close');

//         console.log('File processed.');
//     } catch (err) {
//         console.error(err);
//     }
// })();
// module.exports = pushData;
// if (lineNumber == 0) {
//     if (!isNaN(parseInt(line))) {
//         NumOfNum = parseInt(line);
//         lineNumber++;
//         console.log("Provide " + NumOfNum + " numbers sepearted by space to add: ");
//     } else {
//         console.log("Invalid Input");
//     }
// } else {
//     var sum = line.split(" ");
//     if (sum.length != NumOfNum) {
//         console.log("Given more/less than " + NumOfNum + " Try again");
//     } else {
//         sum = sum.reduce(function (a, b) {
//             return (a * 1) + (b * 1);
//         });
//         console.log("Total: " + sum);
//         process.exit();
//     }
// }





// const fs = require('fs')
// const arquivo = __dirname + "/" + "arquivo1.txt"
// const readstream = fs.createReadStream(arquivo)
// // readstream.setEncoding('UTF8');
// function consoly(){
//     return console.log(readstream)
// }
// consoly()

// module.exports = consoly