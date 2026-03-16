CREATE TABLE recebepbfpessoa(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO recebepbfpessoa (
codigo,
descricao
) VALUES
('0','Não'),
('1','Sim')