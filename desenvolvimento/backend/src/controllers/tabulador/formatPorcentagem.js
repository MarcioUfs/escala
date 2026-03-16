const formatPorcentagem = (um, dois) => {
    let porcento = ''
    let saidaPorcento = '0%'
    try {
        if (dois === 0 || dois === '0' || dois === undefined || um === undefined || um === '0') {
            return '0.00%'
        } else {
            porcento = String((um / dois) * 100)
            let splitPorcento = porcento.split('.')
            if (splitPorcento.length === 1) {
                splitPorcento.push('00')
            }
            let splitFloat = splitPorcento[1].slice(0, 2)
            if (splitPorcento[0] === '0' && splitFloat === '00') {
                saidaPorcento = '< 0.01%'
            } else {
                saidaPorcento = `${splitPorcento[0]}.${splitFloat}%`
            }
            return saidaPorcento
        }

    } catch (error) {
        console.log(error)
    }

}
module.exports = formatPorcentagem;