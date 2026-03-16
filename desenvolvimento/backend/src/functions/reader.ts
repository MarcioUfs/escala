const readline = require('readline');
const fs = require('fs');

function reader(arch_path: string, limit: number, execute: Function) {
    let cont = 0;
    let fila = 0;
    function temVaga() {
        return fila < limit;
    }
    let rl = readline.createInterface({
        input: fs.createReadStream(arch_path)
    })
    rl.on('line', async function (line) {
        let linha = ''
        line = line.split(';')
        if (line[0] === 'uf') {
            line.shift();
        }
        if (isNaN(parseInt(line[0]))) {
            line.shift();
        }
        let saida = line.map((valor, index) => {
            let entra = valor.replace(/['\,()/*]/gm, '').trim()
            if (entra !== '') {
                if (!isNaN(entra)) {
                    if (index === 1 || index === 19 || index === 75 || index === 79 || index === 103 || index === 104 || index === 113 || index === 114 || index === 115) {
                    } else {
                        let verificador = parseInt(entra);
                        entra = verificador.toString();
                    }
                }
            }
            return `'${entra}'`
        })
        linha = saida.join(',')
        if (!temVaga()) {
            rl.pause();
        }
        fila++;
        await execute(linha, cont++);
        fila--;
        if (temVaga()) {
            rl.resume();
        }
    });
    rl.on('close', function () {
        // console.log('fim de leitura');
    })
}

export default reader