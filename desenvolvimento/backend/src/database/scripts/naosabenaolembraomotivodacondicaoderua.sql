CREATE TABLE naosabenaolembraomotivodacondicaoderua(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO naosabenaolembraomotivodacondicaoderua (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')