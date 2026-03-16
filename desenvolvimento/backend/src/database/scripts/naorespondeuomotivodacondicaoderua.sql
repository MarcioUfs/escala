CREATE TABLE naorespondeuomotivodacondicaoderua(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO naorespondeuomotivodacondicaoderua (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')