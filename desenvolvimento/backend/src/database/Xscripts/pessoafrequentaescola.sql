CREATE TABLE pessoafrequentaescola(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO pessoafrequentaescola (
codigo,
descricao
) VALUES
('1','Sim, rede publica'),
('2','Sim, rede particular'),
('3','Não, ja frequentou'),
('4','Nunca frequentou')