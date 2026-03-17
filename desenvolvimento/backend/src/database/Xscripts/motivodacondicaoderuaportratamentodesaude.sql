CREATE TABLE motivodacondicaoderuaportratamentodesaude(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO motivodacondicaoderuaportratamentodesaude (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')