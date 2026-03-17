CREATE TABLE tempoemquemoranacidade(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO tempoemquemoranacidade (
codigo,
descricao
) VALUES
('1','Ate seis meses'),
('2','Entre seis meses e um ano'),
('3','Entre um e dois anos'),
('4','Entre dois e cinco anos'),
('5','Entre cinco e dez anos'),
('6','Mais de dez anos')