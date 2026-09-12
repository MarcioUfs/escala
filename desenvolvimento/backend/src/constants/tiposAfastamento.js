// Categorias fixas de afastamento/restrição — espelham as seções fixas do
// boletim oficial (COPOM/PMSE) usado como referência para o módulo. São um
// conjunto fechado por design (mudar isso implica mudar o próprio layout do
// boletim impresso), por isso ficam como CHECK constraint no banco (mesmo
// padrão de v2_escala.origem e v2_escala_substituicao.tipo) em vez de uma
// tabela de lookup — e são reexportadas aqui pra controller e rotas não
// duplicarem a lista.
const TIPOS_AFASTAMENTO = [
  { valor: "FERIAS", rotulo: "Férias regulamentares", usaTurnoEquipe: false },
  { valor: "FERIAS_LEI_109", rotulo: "Férias regulamentares/LE — Lei 109", usaTurnoEquipe: false },
  { valor: "LICENCA_ESPECIAL", rotulo: "Licença especial", usaTurnoEquipe: false },
  { valor: "CURSO", rotulo: "Curso", usaTurnoEquipe: false },
  { valor: "RESTRICAO_GERAL", rotulo: "Restrição geral", usaTurnoEquipe: false, usaMotivos: true },
  { valor: "RESTRICAO_NOTURNA", rotulo: "Restrição noturna", usaTurnoEquipe: true, usaMotivos: true },
  { valor: "ESCALA_DIFERENCIADA", rotulo: "Escala diferenciada", usaTurnoEquipe: true, usaMotivos: true },
  { valor: "REDUCAO_CARGA", rotulo: "Redução de carga horária", usaTurnoEquipe: false },
  { valor: "AFASTAMENTO", rotulo: "Afastamento", usaTurnoEquipe: false },
];

const VALORES_TIPOS_AFASTAMENTO = TIPOS_AFASTAMENTO.map((t) => t.valor);

const MODOS_RESTRICAO = ["SOMENTE", "EXCETO"];

module.exports = { TIPOS_AFASTAMENTO, VALORES_TIPOS_AFASTAMENTO, MODOS_RESTRICAO };
