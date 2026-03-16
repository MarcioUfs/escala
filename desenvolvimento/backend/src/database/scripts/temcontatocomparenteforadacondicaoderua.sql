CREATE TABLE temcontatocomparenteforadacondicaoderua(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO temcontatocomparenteforadacondicaoderua (
codigo,
descricao
) VALUES
('1','Todo dia'),
('2','Toda semana'),
('3','Todo mes'),
('4','Todo ano'),
('5','Quase nunca'),
('6','Nunca')