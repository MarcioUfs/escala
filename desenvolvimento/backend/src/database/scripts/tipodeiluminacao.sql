CREATE TABLE tipodeiluminacao(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO tipodeiluminacao (
codigo,
descricao
) VALUES
('1','Eletrica com medidor proprio'),
('2','Eletrica com medidor comunitario'),
('3','Eletrica sem medidor'),
('4','Oleo, querosene ou gas'),
('5','Vela'),
('6','Outra forma')