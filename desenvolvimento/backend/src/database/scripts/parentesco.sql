CREATE TABLE parentesco (
	id_parentesco SERIAL PRIMARY KEY NOT NULL,
    codigo VARCHAR,
    descricao VARCHAR NOT NULL
)

--INSERT DATAS
INSERT INTO parentesco(codigo,descricao) VALUES 
    ('1','Pessoa Responsável pela Unidade Familiar'),
    ('2','Conjuge ou companheiro(a)'),
    ('3','Filho(a)'),
    ('4','Enteado(a)'),
    ('5','Neto(a) ou bisneto(a)'),
    ('6','Pai ou mãe'),
    ('7','Sogro(a)'),
    ('8','Irmão ou irmã'),
    ('9','Genro ou nora'),
    ('10','Outro parente'),
    ('11','Não parente')
