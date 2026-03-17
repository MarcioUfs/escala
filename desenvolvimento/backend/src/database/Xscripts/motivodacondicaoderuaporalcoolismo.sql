CREATE TABLE motivodacondicaoderuaporalcoolismo(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO motivodacondicaoderuaporalcoolismo (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')