// require('dotenv').config()
// const knexfile = require('../../knexfile')
// const knex = require('knex')(knexfile['development'])

// module.exports = knex

// db.js
const knexfile = require('../../knexfile'); // Confirme se o knexfile está 2 pastas para trás
const knex = require('knex')(knexfile['development']);

module.exports = knex;