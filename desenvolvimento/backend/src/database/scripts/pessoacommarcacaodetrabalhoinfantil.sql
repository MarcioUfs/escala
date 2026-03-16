CREATE TABLE pessoacommarcacaodetrabalhoinfantil(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO pessoacommarcacaodetrabalhoinfantil (
codigo,
descricao
) VALUES
('1','Sim'),
('2','Não')