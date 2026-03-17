CREATE TABLE numerodemesesaposaultimaatualizacaocadastral(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO numerodemesesaposaultimaatualizacaocadastral (
codigo,
descricao
) VALUES
('0','ate 12 Meses'),
('1','13 a 18 Meses'),
('2','19 a 24 Meses'),
('3','25 a 36 Meses'),
('4','37 a 48 Meses'),
('5','acima de 48 Meses')