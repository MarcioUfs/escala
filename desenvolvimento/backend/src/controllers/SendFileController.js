const init = require('../functions/init');
const createEmptyFile = require('../functions/createEmptyFile');
const pool = require('../database/database');
const cron = require('node-cron');

// Agendar uma tarefa para executar todos os dias às 3 horas da manhã
const job = cron.schedule('0 3 * * *', async function () {
    // console.log('Tarefa agendada executada às 3 horas da manhã.');
    const saida = await pool.query(`SELECT pref_cad, count(*) AS TOTAL FROM pessoas GROUP BY (pref_cad)`)
    console.log(saida.rows)
    return res.status(200).send(saida.rows)

});
const store = (req, res) => {
    try {
        const fido = req.file;
        const filepath = req.file.path;
        init(filepath);
        res.status(200).send({ "msg": "Enviado com sucesso!" })
    } catch (error) {
        createEmptyFile();
        console.log(error)
        res.status(400).send({ "msg": "Arquivo não enviado!" })
    }

}
const show = async (req, res) => {
    try {
        const saida = await pool.query(`SELECT pref_cad, count(*) AS TOTAL FROM pessoas GROUP BY (pref_cad)`)
        return res.status(200).send(saida.rows)
    } catch (error) {
        return res.status(500).send({ "msg": "Erro interno do servidor!" })
    }
}
const deleteB = async (req, res) => {
    try {
        let entrada = req.body
        let splitEntrada = entrada.dataCadastro.split('-')
        const saida = await pool.query(`DELETE FROM pessoas WHERE pref_cad ~* '${splitEntrada[0]}-${splitEntrada[1]}' `)
        return res.status(200).send({ "msg": "Base excluída com sucesso!" })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ "msg": "Erro interno do servidor!" })
    }
}

module.exports = { store: store, show: show, deletar: deleteB };