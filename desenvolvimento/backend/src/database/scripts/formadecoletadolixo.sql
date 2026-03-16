CREATE TABLE formadecoletadolixo(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO formadecoletadolixo (
codigo,
descricao
) VALUES
('1','E coletado diretamente'),
('2','E coletado indiretamente'),
('3','E queimado ou enterrado na propriedade'),
('4','E jogado em terreno baldio ou logradouro (rua, avenida, etc.)'),
('5','E jogado em rio ou mar'),
('6','Tem outro destino')