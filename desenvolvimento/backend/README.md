# cadunicoback

[![Build Status](https://travis-ci.com/MarcioUfs/cadunicoback.svg?token=nWpgBy4eHzVkyNkqYsWs&branch=dev)](https://travis-ci.com/MarcioUfs/cadunicoback)



## ROTEIRO PARA INSTALACAO E USO 

### PASSOS:
 # baixar arquivo: 
 npm install
 npm audit fix --force
 npm audit fix

 # criar arquivo .env
 adicionar os valores

 # criar o banco de dados
 
 # criar tabelas
 npx knex migrate:make users_length
 npx knex migrate:latest
 
 # criar seed
 npx knex seed:make 01_create_users_seeds
 adicionar os valores no seed
 npx knex seed:run

 