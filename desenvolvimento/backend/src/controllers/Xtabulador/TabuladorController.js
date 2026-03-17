const database = require('../../database/db');
const pool = require('../../database/database');
const isEmpty = require('./objectEmpty');
const isKeyExists = require('./isKeyExists');
const verifyDados = require('./verifyDados');
const ListarRegioes = require('./listarRegioes');
const objColuna = require('./seletorColuna');
const arrayWhereIn = require('./arrayWhereIn');
const objectVsColumn = require('./objectVsColumn');
const arrPorcentoFun = require('./arrPorcento');

const tabulador = async function (req, res) {
    let entre = ''
    entre = await iniciar(req.body)
    res.status(200).send(entre)
}

const iniciar = async function (entrada) {
    let splitP = ''
    let splitF = ''
    let arrayGe = []
    let somaP = 0;
    let somaF = 0;
    let verificadorP = true;
    let verificadorF = true;
    let arrayResults = []
    let totalPessoas = ''
    let totalFamilias = ''
    let tamArrEntre = ''
    let arrPorcento = [];

    const myFilter = await arrayWhereIn(entrada.filtros, entrada.coluna);
    const arrMun = await ListarRegioes(entrada.selecaogeografica);
    const seletorColuna = await objColuna(entrada.coluna);
    console.log(arrMun)
    let concatArrays = ''
    async function groupBy(entrada) {

        const queryFamilia = await pool.query(`
            SELECT ${entrada.coluna} AS "f",COUNT(DISTINCT(dcod_familiar_fam)) FROM pessoas 
                WHERE ${myFilter} 
                ${entrada.dataCadastro.codigo} ~* '${entrada.dataCadastro.valor}'
                AND ${entrada.selecaogeografica.codigo} LIKE '${entrada.selecaogeografica.valor}%'
                GROUP BY(${entrada.coluna})
                `)
        const queryPessoa = await pool.query(`
            SELECT ${entrada.coluna} AS "p",COUNT(*) FROM pessoas 
                WHERE ${myFilter} 
                ${entrada.dataCadastro.codigo} ~* '${entrada.dataCadastro.valor}'
                AND ${entrada.selecaogeografica.codigo} LIKE '${entrada.selecaogeografica.valor}%'
                GROUP BY(${entrada.coluna})
                `)
        // const queryFamilia = await pool.query(`
        //     SELECT ${entrada.coluna},COUNT(*) FROM pessoas 
        //         WHERE ${entrada.dataCadastro.codigo} ~* '${entrada.dataCadastro.valor}'
        //         AND dqtde_meses_desat_cat IN ('0','1','2','3','4','5','')
        //         AND dcod_est_cadastral_fam IN ('3')
        //         AND dvlr_renda_media_fam IN ('1','2')
        //         AND dcd_ibge LIKE '28%'
        //         GROUP BY(${entrada.coluna})
        //         `)
        concatArrays = queryPessoa.rows.concat(queryFamilia.rows)
        return concatArrays
    }
    let saida = await groupBy(entrada);

    tamArrEntre = seletorColuna.length
    for (let i = 0; i < tamArrEntre; i++) {
        if (i < ((tamArrEntre) / 2)) {
            splitP = (Object.values(seletorColuna[i])[0]).split('_')
            for (let k = 0; k < saida.length; k++) {
                if (splitP[0] === 'p') {
                    if (splitP[0] === Object.keys(saida[k])[0]) {
                        if (splitP[1] === Object.values(saida[k])[0]) {
                            arrayGe[i] = (JSON.parse(`{"${i}-${Object.values(seletorColuna[i])}-${Object.keys(seletorColuna[i])}":"${Object.values(saida[k])[1]}"}`))
                            somaP += parseInt(Object.values(saida[k])[1])
                        }
                    }
                }
                if (splitP[0] === 'v' && Object.keys(saida[k])[0] !== 'f') {
                    if (saida[k].p === '') {
                        arrayGe[i] = (JSON.parse(`{"${i}-${Object.values(seletorColuna[i])}-${Object.keys(seletorColuna[i])}":"${Object.values(saida[k])[1]}"}`))
                        somaP += parseInt(Object.values(saida[k])[1])
                        verificadorP = false;
                    }
                    if (verificadorP === true && !Object.values(Object.values(saida[k])[0]).includes('')) {
                        arrayGe[i] = (JSON.parse(`{"${i}-${Object.values(seletorColuna[i])}-${Object.keys(seletorColuna[i])}":"0"}`))
                    }
                }
                if (splitP[0] === 'w') {
                    if (Object.values(saida[k])[1] !== '' && Object.keys(saida[k])[1] !== 'p' && Object.keys(saida[k])[1] !== 'f') {
                        arrayGe[i] = (JSON.parse(`{"${i}-${Object.values(seletorColuna[i])}-${Object.keys(seletorColuna[i])}":"${somaP}"}`))
                    }
                    totalPessoas = somaP;
                }
            }
        }
        if (i >= ((tamArrEntre) / 2) && i < tamArrEntre) {
            splitF = (Object.values(seletorColuna[i])[0]).split('_');
            for (let k = 0; k < saida.length; k++) {
                if (splitF[0] === 'f') {
                    if (splitF[0] === Object.keys(saida[k])[0]) {
                        if (splitF[1] === Object.values(saida[k])[0]) {
                            arrayGe[i] = (JSON.parse(`{"${i}-${Object.values(seletorColuna[i])}-${Object.keys(seletorColuna[i])}":"${Object.values(saida[k])[1]}"}`))
                            somaF += parseInt(Object.values(saida[k])[1])
                        }
                    }
                }
                if (splitF[0] === 'y' && Object.keys(saida[k])[0] !== 'p') {
                    if (saida[k].f === '') {
                        arrayGe[i] = (JSON.parse(`{"${i}-${Object.values(seletorColuna[i])}-${Object.keys(seletorColuna[i])}":"${Object.values(saida[k])[1]}"}`));
                        somaF += parseInt(Object.values(saida[k])[1]);
                        verificadorF = false;
                    }
                    if (verificadorF === true && !Object.values(Object.values(saida[k])[0]).includes('')) {
                        arrayGe[i] = (JSON.parse(`{"${i}-${Object.values(seletorColuna[i])}-${Object.keys(seletorColuna[i])}":"0"}`))
                    }
                }
                if (splitF[0] === 'x') {
                    if (Object.values(saida[k])[1] !== '' && Object.keys(saida[k])[1] !== 'p' && Object.keys(saida[k])[1] !== 'f') {
                        arrayGe[i] = (JSON.parse(`{"${i}-${Object.values(seletorColuna[i])}-${Object.keys(seletorColuna[i])}":"${somaF}"}`))
                    }
                    totalFamilias = somaF;
                }
            }

        }
    }
    arrayResults = objectVsColumn(arrayGe, seletorColuna);
    arrPorcento = arrPorcentoFun(tamArrEntre, arrayResults, entrada.coluna, totalPessoas, totalFamilias)
    return arrPorcento
}

////////////////////////////////////////


const totalresult = async function (req, res) {
    // console.log(req.body)

    let entre = ''
    let entrada = req.body
    let escolha = ''
    if (entrada.numero == 'v') {
        entre = await PessoasSemDados(entrada)
    }
    else if (entrada.numero == 'w') {
        entre = await PessoasTotal(entrada)
    }
    else if (entrada.numero == 'y') {
        entre = await FamiliasSemDados(entrada)
    }
    else if (entrada.numero == 'x') {
        entre = await FamiliasTotal(entrada)
    }
    escolha = entrada.numero.split('_')
    if (escolha[0] === 'p') {
        entre = await ConsultaIndividual(entrada, escolha[1])
    }
    if (escolha[0] === 'f') {
        entre = await ConsultaFamilia(entrada, escolha[1])
    }
    return res.send(entre)
}

const PessoasSemDados = async function (entrada) {
    const arrMun = await ListarRegioes(entrada.selecaogeografica)
    // const filtros = await ListarFiltros(entrada.filtros.dados, entrada.dataCadastro)
    let con = await database.select("*").table('pessoas')
        .where(`${entrada.coluna}`, '')
        .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
        // .whereRaw(`${filtros}`)
        .whereIn('dcd_ibge', arrMun).limit(10000)
        .then(data => {
            return data
        }).catch(err => {
            console.log(err)
        })
    // console.log(`pessoas sem dados >>${con.length}<<`)
    return con
}

const PessoasTotal = async function (entrada) {
    const arrMun = await ListarRegioes(entrada.selecaogeografica)
    // const filtros = await ListarFiltros(entrada.filtros.dados, entrada.dataCadastro)
    let con = await database.select("*").from('pessoas').limit(10000)
        .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
        // .whereRaw(`${filtros}`)
        .whereIn('dcd_ibge', arrMun)
        .then(data => {
            return data
        }).catch(err => {
            console.log(err)
        })
    // console.log(`pessoas total >>${con.length}<<`)
    return con
}
const FamiliasSemDados = async function (entrada) {
    const arrMun = await ListarRegioes(entrada.selecaogeografica)
    // const filtros = await ListarFiltros(entrada.filtros.dados, entrada.dataCadastro)
    // const con = []
    let con = await database.select("*").distinct('dcod_familiar_fam').from('pessoas')
        .where('pcod_parentesco_rf_pessoa', '1')
        .where(`${entrada.coluna}`, '')
        .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
        // .whereRaw(`${filtros}`)
        .whereIn('dcd_ibge', arrMun)
        .orWhere(function () {
            this
                // .where(`${entrada.coluna}`, `${valor}`)
                .where(`${entrada.coluna}`, '')
                .where('pcod_parentesco_rf_pessoa', '')
                // .whereRaw(`${filtros}`)
                .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
                .whereIn('dcd_ibge', arrMun).limit(10000)
        })
        .limit(10000)
        .then(data => {
            return data
        }).catch(err => {
            console.log(err)
        })
    // console.log(`familias sem dados>>${con.length}<<`)
    return con
}
const FamiliasTotal = async function (entrada) {
    const arrMun = await ListarRegioes(entrada.selecaogeografica)
    // const filtros = await ListarFiltros(entrada.filtros.dados, entrada.dataCadastro)
    let con = await database.select("*").distinct('dcod_familiar_fam').from('pessoas')
        .where('pcod_parentesco_rf_pessoa', '1')
        .whereIn('dcd_ibge', arrMun)
        .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
        // .whereRaw(`${filtros}`)
        .orWhere(function () {
            this
                // .where(`${entrada.coluna}`, `${valor}`)
                .where('pcod_parentesco_rf_pessoa', '')
                // .whereRaw(`${filtros}`)
                .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
                .whereIn('dcd_ibge', arrMun).limit(10000)
        })
        .limit(10000)
        .then(data => {
            return data
        }).catch(err => {
            console.log(err)
        })
    // let arr = []
    // for (let element of con) {
    //     arr.push(element.dcod_familiar_fam)
    // }
    // let con1 = []
    // if (arr.length > 0) {
    //     con1 = await database.select("*").from('pessoas')
    //     .distinct('dcod_familiar_fam')
    //     .whereIn('dcod_familiar_fam', arr)
    //     .whereIn('dcd_ibge', arrMun)
    //     .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
    //     .groupBy('dcod_familiar_fam')
    //     .limit(10000)
    // }
    // console.log(`familias total >>${con.length}<<`)
    // let con = await database.select("*")
    //     .whereIn('dcd_ibge', arrMun)
    //     .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
    //     .from('pessoas').where(function () {
    //         this.distinct('dcod_familiar_fam').from('pessoas')
    //             .whereIn('dcd_ibge', arrMun)
    //             .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
    //             .limit(10000)
    //     }).then(data => {
    //         return data
    //     }).catch(err => {
    //         console.log(err)
    //     })
    return con
}

const ConsultaIndividual = async function (entrada, valor) {
    const arrMun = await ListarRegioes(entrada.selecaogeografica)
    // const filtros = await ListarFiltros(entrada.filtros.dados, entrada.dataCadastro)
    let con = await database.select().from('pessoas').where(`${entrada.coluna}`, `${valor}`)
        .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`).whereIn('dcd_ibge', arrMun).limit(10000)
        // .whereRaw(`${filtros}`)
        .then(data => {
            return data
        }).catch(err => {
            console.log(err)
        })
    // console.log(`consulta individual >>${con.length}<<`)
    return con
}
const ConsultaFamilia = async function (entrada, valor) {
    const arrMun = await ListarRegioes(entrada.selecaogeografica)
    // const filtros = await ListarFiltros(entrada.filtros.dados, entrada.dataCadastro)
    let con = await database.select("*").from('pessoas').distinct('dcod_familiar_fam')
        .where(`${entrada.coluna}`, `${valor}`)
        .where('pcod_parentesco_rf_pessoa', '1')
        // .whereRaw(`${filtros}`)
        .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
        .whereIn('dcd_ibge', arrMun)
        .orWhere(function () {
            this.where(`${entrada.coluna}`, `${valor}`)
                // .whereRaw(`${filtros}`)
                .where('pcod_parentesco_rf_pessoa', '')
                .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
                .whereIn('dcd_ibge', arrMun).limit(10000)
        })
        .limit(10000)
        .then(data => {
            return data
        }).catch(err => {
            console.log(err)
        })
    // testes(entrada, valor, arrMun)
    // console.log(`consulta familia >>>${con.length}<<`)
    return con
}
const testes = async function (entrada, valor, arrMun) {
    let resultadoF = await database.select().distinct(`dcod_familiar_fam`)
        .table('pessoas')
        .where('pcod_parentesco_rf_pessoa', '1')
        .where(`${entrada.coluna}`, `${valor}`)
        // .whereRaw(`${filtros}`)
        .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
        .whereIn('dcd_ibge', arrMun)
        .orWhere(function () {
            this
                .where('pcod_parentesco_rf_pessoa', '')
                .where(`${entrada.coluna}`, `${valor}`)
                // .whereRaw(`${filtros}`)
                .where('pref_cad', 'like', `${entrada.dataCadastro.valor}%`)
                .whereIn('dcd_ibge', arrMun).limit(10000)
        })
        .limit(10000)
        .then(data => {
            return data
        }).catch(err => {
            console.log(err)
        })
    console.table(resultadoF)
}
const newTabulador = async function (filtros, dataCad) {
    let keyCad = 'data_cad'
    let keyOrder = 'order'
    let keyDados = 'dados'
    let keyLimit = 'limit'
    let keyPageN = 'pageNumber'

    let consulta = ''
    let valueCad = ' '
    let valueOrder = 'dcd_ibge'
    let valueLimit = 100
    let valuePageN = 1
    // console.log(filtros)
    // console.log(JSON.stringify(filtros, null, 2))
    if (isEmpty(filtros)) {
        return []
    } else {
        if (isKeyExists(filtros, keyDados)) {
            if (filtros.dados.length <= 0) {
                consulta = `"id" = -1    `
            } else {
                verifyDados(filtros.dados)
                consulta = verifyDados(filtros.dados)
            }
            if (dataCad.length >= 7) {
                let splitCad = dataCad
                splitCad = splitCad.substring(7, 0)
                valueCad += ` AND pref_cad ~* '${splitCad}' `
            } else {
                valueCad += ` `
            }
            // if (isKeyExists(filtros, keyCad)) {
            //     let splitCad = filtros.data_cad
            //     splitCad = splitCad.substring(7, 0)
            //     valueCad += ` AND pref_cad ~* '${splitCad}' `
            // }
            // if (isKeyExists(filtros, keyOrder)) {
            //     valueOrder = `ORDER BY (${filtros.order}) ASC `
            // } else {
            //     valueOrder = `ORDER BY (dcd_ibge) ASC `
            // }
            // if (isKeyExists(filtros, keyLimit)) {
            //     if (filtros.limit <= 0) {
            //         valueLimit = 100
            //     } else {
            //         valueLimit = filtros.limit
            //     }
            // } else { valueLimit = 100 }
            // if (isKeyExists(filtros, keyPageN)) {
            //     if (filtros.pageNumber <= 0) {
            //         valuePageN = 1
            //     } else {
            //         valuePageN = filtros.pageNumber
            //     }
            // } else { valuePageN = 1 }
            consulta = consulta.replace(/[\./]/gm, '').trim()
            //  console.log(`SELECT COUNT(*) FROM pessoas WHERE ${consulta}${valueCad}`);
            // const payload = await pool.query(`SELECT COUNT(*) FROM pessoas WHERE ${consulta}${valueCad}`);

            // const payload = await pool.query(`SELECT * FROM pessoas WHERE ${consulta}${valueCad}`)
            // const payload = await pool.query(`
            // SELECT id,pnom_pessoa,codigo_municipio_completo,nome_municipio,dfx_rfpc,dvlr_renda_media_fam,dvlr_renda_total_fam,pdta_nasc_pessoa,pind_trabalho_infantil_pessoa,dcod_familiar_fam 
            //     FROM pessoas INNER JOIN municipios ON (pessoas.dcd_ibge = municipios.codigo_municipio_completo) 
            //     WHERE ${consulta}${valueCad}${valueOrder}
            //     LIMIT ${valueLimit} 
            //     OFFSET(${valuePageN - 1}*100)
            //         `)

            // CONTA TODOS OS CADASTROS, CODIGO IBGE E NOME DA CIDADE
            // SELECT COUNT(dcd_ibge),dcd_ibge,nome_municipio
            // FROM pessoas INNER JOIN municipios ON (pessoas.dcd_ibge = municipios.codigo_municipio_completo) GROUP BY(dcd_ibge, municipios.nome_municipio)
            // ORDER BY count

            // NOME,IBGE,NOME DA CIDADE ETC
            // SELECT pnom_pessoa,codigo_municipio_completo,nome_municipio,dfx_rfpc,dvlr_renda_media_fam,dvlr_renda_total_fam,pdta_nasc_pessoa,pind_trabalho_infantil_pessoa,dcod_familiar_fam 
            //     FROM pessoas INNER JOIN municipios ON (pessoas.dcd_ibge = municipios.codigo_municipio_completo) 
            //     WHERE ${consulta}${valueCad}${valueOrder}
            //     LIMIT ${valueLimit} 
            //     OFFSET(${valuePageN - 1}*100)
            return (`SELECT COUNT(*) FROM pessoas WHERE ${consulta}${valueCad}`)
        }
        else {
            return []
        }
    }
}
async function nova2(entrada) {
    let keyCad = 'data_cad'
    let keyOrder = 'order'
    let keyDados = 'dados'
    let keyLimit = 'limit'
    let keyPageN = 'pageNumber'

    let consulta = ''
    let valueCad = ' '
    let valueOrder = 'dcd_ibge'
    let valueLimit = 100
    let valuePageN = 1

    if (isEmpty(entrada)) {
        return []
    } else {
        if (isKeyExists(entrada, keyDados)) {
            if (entrada.dados.length <= 0) {
                consulta = `"id" = -1    `
            } else {
                verifyDados(entrada.dados)
                consulta = verifyDados(entrada.dados)
            }
            if (isKeyExists(entrada, keyCad)) {
                let splitCad = entrada.data_cad
                splitCad = splitCad.substring(7, 0)
                valueCad += ` AND pref_cad ~* '${splitCad}' `
            }
            if (isKeyExists(entrada, keyOrder)) {
                valueOrder = `ORDER BY (${entrada.order}) ASC `
            } else {
                valueOrder = `ORDER BY (dcd_ibge) ASC `
            }
            if (isKeyExists(entrada, keyLimit)) {
                if (entrada.limit <= 0) {
                    valueLimit = 100
                } else {
                    valueLimit = entrada.limit
                }
            } else { valueLimit = 100 }
            if (isKeyExists(entrada, keyPageN)) {
                if (entrada.pageNumber <= 0) {
                    valuePageN = 1
                } else {
                    valuePageN = entrada.pageNumber
                }
            } else { valuePageN = 1 }

            consulta = consulta.replace(/[\./]/gm, '').trim()
            console.log(`SELECT pes.pnom_pessoa AS "Nome",dcd_ibge AS "Código IBGE",fr.descricao AS "Renda percapita",pdta_nasc_pessoa AS "Data nascimento",
                                ti.descricao AS "Trabalho infantil", dcod_familiar_fam AS "Código familiar", mun.nome_municipio AS nome_municipio
                                FROM pessoas AS pes 
                                INNER JOIN municipios AS mun ON (pes.dcd_ibge = mun.codigo_municipio_completo)
                                INNER JOIN pessoacommarcacaodetrabalhoinfantil AS ti ON (pes.pind_trabalho_infantil_pessoa = ti.codigo)
                                INNER JOIN faixadarendafamiliarpercapita AS fr ON (pes.dfx_rfpc = fr.codigo)
                                WHERE ${consulta}${valueCad}${valueOrder}
                                LIMIT ${valueLimit} OFFSET(${valuePageN - 1}*100)
                                `)

            const payload = await pool.query(`SELECT pes.pnom_pessoa AS "Nome",dcd_ibge AS "Código IBGE",fr.descricao AS "Renda percapita",pdta_nasc_pessoa AS "Data nascimento",
                                ti.descricao AS "Trabalho infantil", dcod_familiar_fam AS "Código familiar", mun.nome_municipio AS nome_municipio
                                FROM pessoas AS pes 
                                INNER JOIN municipios AS mun ON (pes.dcd_ibge = mun.codigo_municipio_completo)
                                INNER JOIN pessoacommarcacaodetrabalhoinfantil AS ti ON (pes.pind_trabalho_infantil_pessoa = ti.codigo)
                                INNER JOIN faixadarendafamiliarpercapita AS fr ON (pes.dfx_rfpc = fr.codigo)
                                WHERE ${consulta}${valueCad}${valueOrder}
                                LIMIT ${valueLimit} OFFSET(${valuePageN - 1}*100)
                                `)
            // const payload = await pool.query(`SELECT pnom_pessoa,dcd_ibge,dfx_rfpc,pdta_nasc_pessoa,pind_trabalho_infantil_pessoa,dcod_familiar_fam FROM pessoas WHERE ${consulta}${valueCad}${valueOrder}LIMIT ${valueLimit} OFFSET(${valuePageN - 1}*100)`)
            return payload.rows
        }
        else {
            return []
        }
    }
}
// {
//     let entre = ''
//     entre = req
//     const payload = pool.query(`
//     SELECT mun.nome_municipio AS "Municipio", 
// 			SUM(
// 				CASE 
// 					WHEN pes.dcod_est_cadastral_fam = '2' THEN 1
// 					ELSE 0
// 				END
// 			   )  AS "Sem Registro", 
// 			SUM(
// 				CASE 
// 					WHEN pes.dcod_est_cadastral_fam = '3' THEN 1
// 					ELSE 0
// 				END
// 			   )  AS "Cadastrado",
// 		   SUM(
// 			CASE 
// 				WHEN pes.dcod_est_cadastral_fam = '5' THEN 1
// 				ELSE 0
// 			END
// 		   )  AS "Aguardando NIS",
// 		   SUM(
// 			CASE 
// 				WHEN pes.dcod_est_cadastral_fam = '6' THEN 1
// 				ELSE 0
// 			END
// 		   )  AS "Validando NIS",
// 		   SUM(
// 			CASE 
// 				WHEN pes.dcod_est_cadastral_fam <> '2' 
// 					AND pes.dcod_est_cadastral_fam <> '3' 
// 					AND pes.dcod_est_cadastral_fam <> '5'
// 					AND pes.dcod_est_cadastral_fam <> '6'
// 				THEN 1
// 				ELSE 0
// 			END
// 		   )  AS "Outros"   
//     FROM pessoas AS pes
// 	INNER JOIN municipios AS mun ON (pes.dcd_ibge = mun.codigo_municipio_completo)
// 	WHERE pes.pref_cad ~* '${entre.dataCadastro.valor}' 
// 	GROUP BY (mun.nome_municipio) 
// 	ORDER BY("Cadastrado") DESC`
//     )
//     return payload
// }
module.exports = { tabulador: tabulador, totalresult: totalresult, newTabulador: newTabulador, nova2: nova2 }
