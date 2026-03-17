CREATE TABLE dormeemalbergue(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO dormeemalbergue (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')