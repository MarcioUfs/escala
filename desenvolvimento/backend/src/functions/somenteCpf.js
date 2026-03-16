function somenteCpf(entrada) {
    let cpfValido = entrada
    let re =  ''
    if (cpfValido) {
        re = cpfValido.replace(/\D/g, '')
        let tamanho = re.length;
        if(tamanho !== 11){
            return 0
        }else{
            return re
        }
    }else{
        return 0
    }
}
module.exports = somenteCpf;