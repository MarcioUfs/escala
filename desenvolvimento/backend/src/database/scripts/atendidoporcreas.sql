CREATE TABLE atendidoporcreas(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO atendidoporcreas (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')