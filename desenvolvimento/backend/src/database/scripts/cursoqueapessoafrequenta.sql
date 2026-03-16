CREATE TABLE cursoqueapessoafrequenta(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO cursoqueapessoafrequenta (
codigo,
descricao
) VALUES
('1','Creche'),
('2','Pre-escola (exceto CA)'),
('3','Classe de Alfabetizacao - CA'),
('4','Ensino Fundamental regular (duracao 8 anos)'),
('5','Ensino Fundamental regular (duracao 9 anos)'),
('6','Ensino Fundamental especial'),
('7','Ensino Medio regular'),
('8','Ensino Medio especial'),
('9','Ensino Fundamental EJA - series iniciais (Supletivo - 1ª a 4ª)'),
('10','Ensino Fundamental EJA - series finais (Supletivo - 5ª a 8ª)'),
('11','Ensino Medio EJA (Supletivo)'),
('12','Alfabetizacao para adultos(Mobral, etc.)'),
('13','Superior, Aperfeicoamento,Especializacao, Mestrado,Doutorado#14 - Pre-vestibular')