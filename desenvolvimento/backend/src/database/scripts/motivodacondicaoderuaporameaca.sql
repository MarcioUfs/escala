CREATE TABLE motivodacondicaoderuaporameaca(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO motivodacondicaoderuaporameaca (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')