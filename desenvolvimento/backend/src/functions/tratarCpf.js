function tratarCPF(entrada) {
    let cpfValido = entrada
    let re =  ''
    if (cpfValido) {
        re = cpfValido.replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');

        let tamanho = re.length;
        if(tamanho < 14 || tamanho > 15){
            return 0
        }else{
            return re
        }
    }else{
        return 0
    }
}
module.exports = tratarCPF