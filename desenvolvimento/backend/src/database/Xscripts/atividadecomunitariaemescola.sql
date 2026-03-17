CREATE TABLE atividadecomunitariaemescola(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO atividadecomunitariaemescola (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')