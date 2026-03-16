CREATE TABLE naorespondeucomoganhadinheiro(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO naorespondeucomoganhadinheiro (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')