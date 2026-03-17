CREATE TABLE anoeseriedocursoqueapessoafrequenta(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO anoeseriedocursoqueapessoafrequenta (
codigo,
descricao
) VALUES
('1','Primeiro(a)'),
('2','Segundo(a)'),
('3','Terceiro(a)'),
('4','Quarto(a)'),
('5','Quinto(a)'),
('6','Sexto(a)'),
('7','Setimo(a)'),
('8','Oitavo(a)'),
('9','Nono(a)'),
('10','Curso nao-seriado')