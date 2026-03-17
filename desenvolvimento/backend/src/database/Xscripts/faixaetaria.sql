CREATE TABLE faixaetaria(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO faixaetaria (
codigo,
descricao
) VALUES
('0','Entre 0 e 4'),
('1','Entre 5 a 6'),
('2','Entre 7 a 15'),
('3','Entre 16 a 17'),
('4','Entre 18 a 24'),
('5','Entre 25 a 34'),
('6','Entre 35 a 39'),
('7','Entre 40 a 44'),
('8','Entre 45 a 49'),
('9','Entre 50 a 54'),
('10','Entre 55 a 59'),
('11','Entre 60 a 64'),
('12','Maior que  65')