CREATE TABLE calcamentoemfrenteaoseudomicilio(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO calcamentoemfrenteaoseudomicilio (
codigo,
descricao
) VALUES
('1','Total'),
('2','Parcial'),
('3','Nao existe')