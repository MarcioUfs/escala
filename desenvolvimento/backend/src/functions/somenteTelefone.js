function somenteTelefone(entrada) {
    let telefoneValido = entrada
    let re =  ''
    if (telefoneValido) {
        re = telefoneValido.replace(/\D/g, '')
        let tamanho = re.length;
        if(tamanho !== 11 || tamanho !== 10){
            return 0
        }else{
            return re
        }
    }else{
        return 0
    }
}
module.exports = somenteTelefone;