CREATE TABLE motivodacondicaoderuaportrabalho(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO motivodacondicaoderuaportrabalho (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')