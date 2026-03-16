CREATE TABLE atendidoporinstituicaogovernamental(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO atendidoporinstituicaogovernamental (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')