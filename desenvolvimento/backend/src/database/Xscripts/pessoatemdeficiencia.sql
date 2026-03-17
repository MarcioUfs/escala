CREATE TABLE pessoatemdeficiencia(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO pessoatemdeficiencia (
codigo,
descricao
) VALUES
('1','Sim'),
('2','Não')