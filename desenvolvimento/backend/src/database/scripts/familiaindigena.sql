CREATE TABLE familiaindigena(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO familiaindigena (
codigo,
descricao
) VALUES
('1','Sim'),
('2','Não')