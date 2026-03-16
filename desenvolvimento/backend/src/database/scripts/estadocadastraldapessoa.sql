CREATE TABLE estadocadastraldapessoa(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO estadocadastraldapessoa (
codigo,
descricao
) VALUES
('2','Sem Registro Civil'),
('3','Cadastrado'),
('5','Aguardando NIS'),
('6','Validando NIS')