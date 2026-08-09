// function limparEspacos(texto){
//     if(!texto || typeof texto !== 'string'){
//         return '';
//     }
//     return texto.trim().replace(/\s+/g, ' ');
// }
// module.exports = limparEspacos;

function limparEspacos(texto) {
    if (typeof texto !== 'string' || !texto) {
        return '';
    }
    return texto.trim().replace(/\s+/g, ' ');
}

module.exports = limparEspacos;