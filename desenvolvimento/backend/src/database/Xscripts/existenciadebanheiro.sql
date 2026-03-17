CREATE TABLE existenciadebanheiro(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO existenciadebanheiro (
codigo,
descricao
) VALUES
('1','Sim'),
('2','Não')