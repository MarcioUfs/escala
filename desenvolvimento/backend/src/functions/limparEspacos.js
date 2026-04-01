function limparEspacos(texto){
    if(!texto || typeof texto !== 'string'){
        return '';
    }
    return texto.trim().replace(/\s+/g, ' ');
}
module.exports = limparEspacos;