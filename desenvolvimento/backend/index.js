const app = require('./app');
const os = require('os');
require('dotenv').config();
const port = process.env.PORT || 3030;

const ip = getIPAddress();

app.listen(port, () => {
    console.log(`App running on http://${ip}:${port}`);
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