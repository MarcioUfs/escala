CREATE TABLE teveempregocomcarteiraassinada(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO teveempregocomcarteiraassinada (
codigo,
descricao
) VALUES
('1','Sim'),
('2','Não'),
('3','Não sabe')