CREATE TABLE nascimentoregistradoemcartorio(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO nascimentoregistradoemcartorio (
codigo,
descricao
) VALUES
('1','Sim e tem Certidao de Nascimento'),
('2','Sim, mas nao tem Certidao de Nascimento'),
('3','Não'),
('4','Não sabe')