CREATE TABLE ganhadinheirocomocarregador(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO ganhadinheirocomocarregador (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')