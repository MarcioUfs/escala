CREATE TABLE localdenascimento(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO localdenascimento (
codigo,
descricao
) VALUES
('1','Neste municipio'),
('2','Em outro municipio'),
('3','Em outro pais')