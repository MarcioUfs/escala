function tratarTelefoneLimpo(entrada) {
    let telLimpo = entrada.replace(/\D/g, '');
    
    if (telLimpo.length === 10 || telLimpo.length === 11) {
        return telLimpo;
    } else {
        return 0;
    }
}

module.exports = tratarTelefoneLimpo;