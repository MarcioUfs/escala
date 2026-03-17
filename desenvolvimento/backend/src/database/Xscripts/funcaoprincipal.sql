CREATE TABLE funcaoprincipal(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO funcaoprincipal (
codigo,
descricao
) VALUES
('1','Trabalhador por conta propria (bico, autonomo)'),
('2','Trabalhador temporario em area rural'),
('3','Empregado sem carteira de trabalho assinada'),
('4','Empregado com carteira de trabalho assinada'),
('5','Trabalhador domestico sem carteira de trabalho assinada'),
('6','Trab. domestico com cart. de trab. assinada'),
('7','Trabalhador nao-remunerado'),
('8','Militar ou servidor publico'),
('9','Empregador'),
('10','Estagiario'),
('11','Aprendiz')