CREATE TABLE motivodacondicaoderuaporpreferencia(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO motivodacondicaoderuaporpreferencia (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')