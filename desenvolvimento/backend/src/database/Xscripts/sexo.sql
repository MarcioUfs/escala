CREATE TABLE sexo(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO sexo (
codigo,
descricao
) VALUES
('1','Masculino'),
('2','Feminino')