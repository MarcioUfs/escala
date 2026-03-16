CREATE TABLE atendidoporhospitalclinicageral(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO atendidoporhospitalclinicageral (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')