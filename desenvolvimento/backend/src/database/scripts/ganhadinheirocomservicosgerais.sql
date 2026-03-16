CREATE TABLE ganhadinheirocomservicosgerais(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO ganhadinheirocomservicosgerais (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')