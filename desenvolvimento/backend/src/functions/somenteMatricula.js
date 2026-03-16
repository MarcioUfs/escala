function somenteMatricula(entrada) {
    let matricula = entrada
    let re =  ''
    if (matricula) {
        re = matricula.replace(/\D/g, '')
        let tamanho = re.length;
        if(tamanho !== 12){
            return null
        }else{
            return re
        }
    }else{
        return null
    }
}
module.exports = somenteMatricula;