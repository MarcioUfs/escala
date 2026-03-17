CREATE TABLE faixadarendafamiliarpercapita(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO faixadarendafamiliarpercapita (
codigo,
descricao
) VALUES
('1','Ate R$89,00'),
('2','Entre R$85,01 ate R$178,00'),
('3','Entre R$178,01 ate 1/2 S.M.'),
('4','Acima de 1/2 S.M.')
