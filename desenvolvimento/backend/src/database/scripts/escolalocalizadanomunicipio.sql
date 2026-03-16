CREATE TABLE escolalocalizadanomunicipio(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO escolalocalizadanomunicipio (
codigo,
descricao
) VALUES
('1','Sim'),
('2','Não')