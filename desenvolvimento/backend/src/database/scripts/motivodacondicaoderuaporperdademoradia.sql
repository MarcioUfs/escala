CREATE TABLE motivodacondicaoderuaporperdademoradia(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO motivodacondicaoderuaporperdademoradia (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')