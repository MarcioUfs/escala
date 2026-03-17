CREATE TABLE ganhadinheirocomvendas(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO ganhadinheirocomvendas (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')