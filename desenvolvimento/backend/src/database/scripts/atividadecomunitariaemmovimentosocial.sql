CREATE TABLE atividadecomunitariaemmovimentosocial(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO atividadecomunitariaemmovimentosocial (
codigo,
descricao
) VALUES
('0','Sim'),
('1','Não')