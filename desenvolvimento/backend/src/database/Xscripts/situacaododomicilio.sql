CREATE TABLE situacaododomicilio(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO situacaododomicilio (
codigo,
descricao
) VALUES
('1','Urbanas'),
('2','Rurais')