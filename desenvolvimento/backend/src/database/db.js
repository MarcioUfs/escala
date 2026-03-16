require('dotenv').config()
const knexfile = require('../../knexfile')
const knex = require('knex')(knexfile['development'])
// const knex = require('knex')({
//     client: process.env.DATABASE_CLIENT,
//     connection: {
//         host: process.env.DATABASE_HOST,
//         user: process.env.DATABASE_USERNAME,
//         password: process.env.DATABASE_PASSWORD,
//         database: process.env.DATABASE
//     }
//   })
  module.exports = knex