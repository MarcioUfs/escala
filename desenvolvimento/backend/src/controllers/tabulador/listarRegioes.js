const database = require('../../database/db');

const listcodigoregioes = async function (mun) {
    let arrcmc = []
    // console.log(mun)
    if (mun.codigo === 'mesorregiao_geografica') {
        let con = await database.select('codigo_municipio_completo').table('municipios').whereIn('mesorregiao_geografica', [`${mun.valor}`])
            .then(data => {
                return data
            }).catch(err => {
                console.log(err)
            })
        for (element of con) {
            arrcmc.push(element.codigo_municipio_completo)
        }
        // console.log(arrcmc, arrcmc.length)
        return arrcmc
    }
    if (mun.codigo === 'dcd_ibge' && mun.valor === '28') {
        let con = await database.select('codigo_municipio_completo').table('municipios').whereIn('mesorregiao_geografica', ['01', '02', '03'])
            .then(data => {
                return data
            }).catch(err => {
                console.log(err)
            })
        for (element of con) {
            arrcmc.push(element.codigo_municipio_completo)
        }
        // console.log(arrcmc, arrcmc.length)
        return arrcmc
    }
    else if (mun.codigo === 'dcd_ibge' && mun.valor !== '28') {
        let con = await database.select('codigo_municipio_completo').table('municipios').whereIn('codigo_municipio_completo', [`${mun.valor}`])
            .then(data => {
                return data
            }).catch(err => {
                console.log(err)
            })
        for (element of con) {
            arrcmc.push(element.codigo_municipio_completo)
        }
        // console.log(arrcmc, arrcmc.length)
        return arrcmc
    }
}
module.exports = listcodigoregioes;