CREATE TABLE pessoaestavaafastadanasemanapassada(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO pessoaestavaafastadanasemanapassada (
codigo,
descricao
) VALUES
('1','Sim'),
('2','Não')