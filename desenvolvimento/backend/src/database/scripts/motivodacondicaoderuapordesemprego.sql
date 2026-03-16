CREATE TABLE motivodacondicaoderuapordesemprego(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO motivodacondicaoderuapordesemprego (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')