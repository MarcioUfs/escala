function tratarTelefone(entrada) {
    let telValido = entrada.replace(/\D/g, '');
    
    if (telValido.length === 10) {
        // Fixo: (DD) XXXX-XXXX
        telValido = telValido.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (telValido.length === 11) {
        // Celular: (DD) 9 XXXX-XXXX
        telValido = telValido.replace(/(\d{2})(\d)(\d{4})(\d{4})/, '($1) $2 $3-$4');
    } else {
        return 0;
    }
    
    return telValido;
}

module.exports = tratarTelefone;