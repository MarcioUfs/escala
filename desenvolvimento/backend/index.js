// const app = require('./app');
// const os = require('os');
// require('dotenv').config();
// const port = process.env.PORT || 3030;

// /**
//  * CONFIGURAÇÃO DE SEGURANÇA: Trust Proxy
//  * --------------------------------------------------------------------------
//  * CRITÉRIO DE SEGURANÇA: Sem isso, o express-rate-limit não consegue 
//  * validar se o IP de origem (especialmente IPv6) é confiável ou forjado.
//  * * TESTE LOCAL: Use 'loopback' (confia apenas em 127.0.0.1 e ::1).
//  * PRODUÇÃO: Substitua por 1 (se houver 1 proxy na frente) ou o IP do Nginx.
//  */
// const isProduction = process.env.NODE_ENV === 'production';
// app.set('trust proxy', isProduction ? 1 : 'loopback');

// const ip = getIPAddress();

// app.listen(port, () => {
//     console.log(`App running on http://${ip}:${port}`);
//     // O aviso de agendador e o log de ambiente (dotenv) aparecerão aqui
// });

// function getIPAddress() {
//     const interfaces = os.networkInterfaces();
//     for (const interfaceName in interfaces) {
//         const networkInterface = interfaces[interfaceName];
//         for (const info of networkInterface) {
//             // Alterado para aceitar IPv4 e garantir que não seja interno
//             if (!info.internal && (info.family === 'IPv4' || info.family === 4)) {
//                 return info.address;
//             }
//         }
//     }
//     return '127.0.0.1';
// }

const app = require('./app');
const os = require('os');
require('dotenv').config();
const PORT = process.env.PORT || 3030;

const ip = getIPAddress();

app.listen(PORT, () => {
    console.log(`App running on http://${ip}:${PORT}`);
});

function getIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const interface = interfaces[interfaceName];
        for (const info of interface) {
            if (!info.internal && info.family === 'IPv4') {
                return info.address;
            }
        }
    }
    return '127.0.0.1'; // Retorna localhost se não encontrar nenhum endereço IP válido
}