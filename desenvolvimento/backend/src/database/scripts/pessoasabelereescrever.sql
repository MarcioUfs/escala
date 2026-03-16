CREATE TABLE pessoasabelereescrever(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO pessoasabelereescrever (
codigo,
descricao
) VALUES
('1','Sim'),
('2','Não')