CREATE TABLE tipodecertidao(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO tipodecertidao (
codigo,
descricao
) VALUES
('1','Nascimento'),
('2','Casamento'),
('3','RANI')