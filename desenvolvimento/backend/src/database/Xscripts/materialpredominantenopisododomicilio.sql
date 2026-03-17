CREATE TABLE materialpredominantenopisododomicilio(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO materialpredominantenopisododomicilio (
codigo,
descricao
) VALUES
('1','Terra'),
('2','Cimento'),
('3','Madeira aproveitada'),
('4','Madeira aparelhada'),
('5','Ceramica, lajota ou pedra'),
('6','Carpete'),
('7','Outro Material')