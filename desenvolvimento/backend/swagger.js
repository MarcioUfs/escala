// swagger.js
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'API E-Escala',
    description: 'Documentação automática do sistema de gerenciamento de escalas',
  },
  host: 'localhost:3000',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
// Aqui você aponta para o seu arquivo principal de rotas
const endpointsFiles = ['./src//routes/adminroutes.js','./src/routes/userroutes.js','./src/routes/v2EscalaRoutes.js','./src/routes/setorroutes.js']; 

// Gera o arquivo swagger-output.json
swaggerAutogen(outputFile, endpointsFiles, doc);