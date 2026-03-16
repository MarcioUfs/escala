CREATE TABLE situacaoderua(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO situacaoderua (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')