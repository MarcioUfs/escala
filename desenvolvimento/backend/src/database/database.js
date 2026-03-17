require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({
  user: process.env.DATABASE_USERNAME || 'postgres',
  host: 'localhost',
  database: process.env.DATABASE || 'db_escala_pmse',
  password: process.env.DATABASE_PASSWORD || '123456'
})

module.exports = pool

// const pool = require('knex')({
//   client: 'pg',
//   connection: {
//       host: process.env.DATABASE_HOST,
//       user: process.env.DATABASE_USERNAME,
//       password: process.env.DATABASE_PASSWORD,
//       database: process.env.DATABASE
//   }
// })
// module.exports = pool
