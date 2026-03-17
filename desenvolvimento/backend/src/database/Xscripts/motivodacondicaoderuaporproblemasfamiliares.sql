CREATE TABLE motivodacondicaoderuaporproblemasfamiliares(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO motivodacondicaoderuaporproblemasfamiliares (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')