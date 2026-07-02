function somenteTelefone(entrada) {
    let telefoneValido = entrada
    let re =  ''
    if (telefoneValido) {
        re = telefoneValido.replace(/\D/g, '')
        let tamanho = re.length;
        console.log('Tamanho do telefone:', tamanho, 'Telefone formatado:', re);
        if(tamanho === 11 || tamanho === 10){
            return re
        }else{
            return 0
        }
    }else{
        return 0
    }
}
module.exports = somenteTelefone;