CREATE TABLE pbf (
	id_pbf SERIAL PRIMARY KEY NOT NULL,
    codigo VARCHAR,
	descricao VARCHAR,
	disponibilidade BOOLEAN
)

--INSERT DATAS
INSERT INTO pbf(codigo,descricao,disponibilidade) VALUES 
    ('0','Não',true),
    ('1','Sim',true)