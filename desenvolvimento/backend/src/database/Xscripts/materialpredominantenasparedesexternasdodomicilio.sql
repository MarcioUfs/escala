CREATE TABLE materialpredominantenasparedesexternasdodomicilio(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO materialpredominantenasparedesexternasdodomicilio (
codigo,
descricao
) VALUES
('1','Alvenaria/tijolo com revestimento'),
('2','Alvenaria/tijolo sem revestimento'),
('3','Madeira aparelhada'),
('4','Taipa revestida'),
('5','Taipa nao revestida'),
('6','Madeira aproveitada'),
('7','Palha'),
('8','Outro Material')