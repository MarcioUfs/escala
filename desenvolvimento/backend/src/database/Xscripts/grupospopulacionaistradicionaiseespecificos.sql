CREATE TABLE grupospopulacionaistradicionaiseespecificos(
	id SERIAL PRIMARY KEY,
	codigo VARCHAR,
	descricao VARCHAR
)

INSERT INTO grupospopulacionaistradicionaiseespecificos (
codigo,
descricao
) VALUES
('101','Famlia Cigana'),
('201','Familia Extrativista'),
('202','Familia de Pescadores  Artesanais'),
('203','Familia Pertencente a Comunidade de Terreiro'),
('204','Familia Ribeirinha'),
('205','Familia Agricultores Familiares'),
('301','Familia Assentada da Reforma Agraria'),
('302','Familia Beneficiaria do Programa Nacional do Credito Fundiario'),
('303','Familia Acampada'),
('304','Familia Atingida por Empreendimentos de Infraestrutura'),
('305','Familia de Preso do Sistema Carcerario'),
('306','Familia Catadores de Material Reciclavel'),
('0','Nenhuma')