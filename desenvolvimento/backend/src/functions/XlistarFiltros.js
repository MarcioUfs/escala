const combinaFiltros = async function (entrada, dataCad) {
    let data_cad = dataCad;
    // let dados =  `pfx_idade = '1' AND dcod_escoa_sanitario_domic_fam = '1' AND pgrau_instrucao = '1' OR
    //          pfx_idade = '1' AND dcod_escoa_sanitario_domic_fam = '2' AND pgrau_instrucao = '2' OR `
    let dados = '    '
    let splitConjunto = ''
    let splitEntrada = []
    let qtdCodigo = 0;
    let tipoCodigo = ''
    // console.log("10 entrada>>",entrada, dataCad)
//     if (entrada.length > 0) {
//         // splitConjunto = entrada.split(',') 
//         let contador = entrada.length;
//         for (let i = 0; i < entrada.length; i++) {
//             splitEntrada = entrada[i].split('ø');
//             objEntrada = JSON.parse(`{"codigo":"${splitEntrada[0]}","valor":"${splitEntrada[1]}"}`)
//             dados.push(objEntrada)
//             console.log(dados, i, objEntrada)
//         }
//     }
// console.log(dados,"2 etapa")
//     if (dados.length > 0) {
//         for (let i = 0; i < dados.length; i++) {
//             dados += `${dados[i].codigo} = '${dados[i].valor}' AND `
//             // if (tipoCodigo.length > 0 || i < dados.length) {
//             //     if (dados[i].codigo == dados[i+1].codigo) {
//             //         console.log(`21 dados>> ${JSON.stringify(dados[i])}`)
//             //     } else {
//             //         console.log(`23 nao sao diferentes`)
//             //     }
//             // } else {
//             //     console.log(`26 nao funfou`)
//             //     tipoCodigo += dados[i];
//             // }
//         }
//     } else {
//         dados = ` AND`
//     }

//     // console.log("32 tipoCodigo>>",tipoCodigo)
//     // console.log(entrada.length)
//     // if(entrada){
//     //     if(true){

//     //     }
//     // }
//     // for (let i = 0; i > entrada.length; i++) {
//     //     //pfx_idade = '1' AND dcod_escoa_sanitario_domic_fam = '1' AND pgrau_instrucao = '1' OR
//     //     dados += `${entrada[i].coluna} = '${entrada[i].valor}' AND `

//     // }
//     if (dados.length > 0) {

        dados = dados.substring(0, dados.length - 4)
//     }
//     console.log("52 dados>>>>>>", dados)
    // else{
    //     dados = []
    // }
    // console.log(dados)
    return dados
}
module.exports = combinaFiltros;