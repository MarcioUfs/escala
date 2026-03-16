function verifyDados(entrada) {
    let trueCol = false
    let trueVal = false
    let saida = ''
    let formaPesquisa = ''
    for (let i = 0; i < entrada.length; i++) {
        trueCol = Object.keys(entrada[i]).includes('coluna')
        trueVal = Object.keys(entrada[i]).includes('valor')
        isArr = Array.isArray(entrada[i].valor)
        if (trueCol === true && trueVal === true && entrada[i].coluna !== '' && entrada[i].valor.length > 0 && isArr === true) {
            if (i === entrada.indexOf(entrada[i])) {
                let newStr = entrada[i].valor.toString()
                newStr = newStr.replace(/,/g, '\',\'')
                formaPesquisa += `'`
                formaPesquisa += newStr
                formaPesquisa += `'`
            }
            if (entrada.length > 0) {
                saida += ` ${entrada[i].coluna} IN (${formaPesquisa}) AND `
            } else {
                saida += ` ${entrada[i].coluna} IN (${formaPesquisa})`
            }
            formaPesquisa = ''
        }
    }
    saida = saida.substring(0, saida.length - 4)
    return saida
}
module.exports = verifyDados;