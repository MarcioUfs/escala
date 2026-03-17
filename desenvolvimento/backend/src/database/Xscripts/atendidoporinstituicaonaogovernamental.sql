CREATE TABLE atendidoporinstituicaonaogovernamental(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO atendidoporinstituicaonaogovernamental (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')