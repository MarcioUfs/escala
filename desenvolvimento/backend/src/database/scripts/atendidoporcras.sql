CREATE TABLE atendidoporcras(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO atendidoporcras (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')