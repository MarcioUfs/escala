CREATE TABLE ganhadinheirocomocatador(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO ganhadinheirocomocatador (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')