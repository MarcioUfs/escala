CREATE TABLE atendidoporcentrorefpoprua(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO atendidoporcentrorefpoprua (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')