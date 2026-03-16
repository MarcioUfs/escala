CREATE TABLE pessoatrabalhounasemanapassada(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO pessoatrabalhounasemanapassada (
codigo,
descricao
) VALUES
('1','Sim'),
('2','Não')