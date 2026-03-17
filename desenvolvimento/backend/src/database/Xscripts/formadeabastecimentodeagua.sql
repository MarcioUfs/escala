CREATE TABLE formadeabastecimentodeagua(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO formadeabastecimentodeagua (
codigo,
descricao
) VALUES
('1','Rede geral de distribuicao'),
('2','Poco ou nascente'),
('3','Cisterna'),
('4','Outra forma')