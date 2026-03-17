CREATE TABLE motivodacondicaoderuaporoutromotivo(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO motivodacondicaoderuaporoutromotivo (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')