CREATE TABLE cursomaiselevadoqueapessoafrequentou(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO cursomaiselevadoqueapessoafrequentou (
codigo,
descricao
) VALUES
('1','Creche'),
('2','Pre-escola (exceto CA)'),
('3','Classe de Alfabetizacao - CA'),
('4','Ensino Fundamental 1ª a 4ª series, Elementar (Primario), Primeira fase do 1º grau'),
('5','Ensino Fundamental 5ª a 8ª series, Medio 1º ciclo (Ginasial), Segunda fase do 1º grau'),
('6','Ensino Fundamental (duracao 9 anos)'),
('7','Ensino Fundamental Especial'),
('8','Ensino Medio, 2º grau, Medio 2º ciclo (Cientifico, Classico, Tecnico, Normal)'),
('9','Ensino Medio Especial'),
('10','Ensino Fundamental EJA -series iniciais (Supletivo 1ª a 4ª)'),
('11','Ensino Fundamental EJA -series finais (Supletivo 5ª a 8ª)'),
('12','Ensino Medio EJA(Supletivo)'),
('13','Superior, Aperfeicoamento,Especializacao, Mestrado,Doutorado'),
('14','Alfabetizacao para Adultos(Mobral, etc.)'),
('15','Nenhum')