CREATE TABLE naosabesefrequentouatividadecomunitaria(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO naosabesefrequentouatividadecomunitaria (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')