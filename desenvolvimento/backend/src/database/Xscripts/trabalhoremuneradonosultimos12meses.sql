CREATE TABLE trabalhoremuneradonosultimos12meses(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO trabalhoremuneradonosultimos12meses (
codigo,
descricao
) VALUES
('1','Sim'),
('2','Não')