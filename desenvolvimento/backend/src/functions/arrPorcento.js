const formatPorcentagem = require('./formatPorcentagem');

function arrPorcentoFun(tamArrEntre, arrayResults, entradaColuna, totalPessoas, totalFamilias) {
    let arrPorcento = [];
    for (let i = 0; i < tamArrEntre; i++) {
        let splitGeral = ''
        splitGeral = (Object.keys(arrayResults[i])[0]).split('-')
        if (i < (tamArrEntre / 2)) {
            arrPorcento.push(JSON.parse(`{
                "ordem":"${splitGeral[0]}",
                "codigo":"${splitGeral[2]}",
                "descritor":"${splitGeral[1]}",
                "coluna":"${entradaColuna}",
                "percentual":"${formatPorcentagem(Object.values(arrayResults[i])[0], totalPessoas)}",
                "resultado":"${Object.values(arrayResults[i])[0]}"
            }`))
        } else {
            arrPorcento.push(JSON.parse(`{
                "ordem":"${splitGeral[0]}",
                "codigo":"${splitGeral[2]}",
                "descritor":"${splitGeral[1]}",
                "coluna":"${entradaColuna}",
                "percentual":"${formatPorcentagem(Object.values(arrayResults[i])[0], totalFamilias)}",
                "resultado":"${Object.values(arrayResults[i])[0]}"
            }`))
        }
    }
    return arrPorcento;
}
module.exports = arrPorcentoFun;