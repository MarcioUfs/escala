CREATE TABLE naorespondeusefrequentouatividadecomunitaria(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO naorespondeusefrequentouatividadecomunitaria (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')