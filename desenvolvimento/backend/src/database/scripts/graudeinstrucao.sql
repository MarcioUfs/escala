CREATE TABLE graudeinstrucao(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO graudeinstrucao (
codigo,
descricao
) VALUES
('1','Sem instrucao'),
('2','Fundamental incompleto'),
('3','Fundamental completo'),
('4','Medio incompleto'),
('5','Medio completo'),
('6','Superior incompleto ou mais')