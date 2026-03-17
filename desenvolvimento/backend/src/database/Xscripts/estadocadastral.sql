CREATE TABLE estadocadastral (
	id_estadocadastral SERIAL PRIMARY KEY NOT NULL,
    codigo VARCHAR,
    descricao VARCHAR NOT NULL,
    parabase VARCHAR NOT NULL 
)
-- CREATE TABLE estadocadastral (
-- 	id_estadocadastral SERIAL PRIMARY KEY NOT NULL,
--     codigo VARCHAR,
--     descricao VARCHAR NOT NULL,
--     fk_listadados INT,
--     FOREIGN KEY (fk_listadados) REFERENCES listadados (id)
-- )

--INSERT DATAS
INSERT INTO estadocadastral(codigo,descricao,parabase) VALUES 
    ('2','Sem Registro Civil','dcod_est_cadastral_fam'),
    ('3','Cadastrado','dcod_est_cadastral_fam')


