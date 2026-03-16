CREATE TABLE especiedodomicilio(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO especiedodomicilio (
codigo,
descricao
) VALUES
('1','Particular Permanente'),
('2','Particular improvisado'),
('3','Coletivo')