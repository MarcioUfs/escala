import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ChevronDown,
  FileText,
  GraduationCap,
  Megaphone,
  Palmtree,
  Search,
  Users,
} from "lucide-react";

// ---------------------------------------------------------------------------
// TELA MOCKADA — o backend de boletins ainda não existe. Todo o conteúdo vem
// de BOLETINS_MOCK e passa por carregarBoletins(); quando a API estiver
// pronta, basta trocar o corpo dessa função por uma chamada em api.js
// (ex: api.get("/boletins")) mantendo o mesmo formato de item:
//   { id, tipo, titulo, resumo, conteudo, bgo, publicado_em (AAAA-MM-DD),
//     publicado_por, lido }
// ---------------------------------------------------------------------------
const BOLETINS_MOCK = [
  {
    id: 1,
    tipo: "FERIAS",
    titulo: "Escala de férias — 1º período de 2027",
    resumo: "Publicada a relação de militares com férias regulamentares a partir de janeiro.",
    conteudo:
      "Ficam publicadas as férias regulamentares do 1º período de 2027. Os militares relacionados devem apresentar-se às suas seções até 5 dias úteis antes do início do gozo para a passagem de serviço. Eventuais pedidos de alteração devem ser encaminhados à administração com no mínimo 30 dias de antecedência.",
    bgo: "192/2026",
    publicado_em: "2026-09-16",
    publicado_por: "Administração",
    lido: false,
  },
  {
    id: 2,
    tipo: "CURSO",
    titulo: "Curso de atualização em atendimento de emergência",
    resumo: "Inscrições abertas para o curso de atualização, com vagas limitadas por turno.",
    conteudo:
      "Estão abertas as inscrições para o curso de atualização em atendimento de emergência, com carga horária de 40 horas. As vagas são limitadas e distribuídas por turno de serviço. Os interessados devem manifestar interesse por meio da chefia imediata até o dia 30/09/2026.",
    bgo: "190/2026",
    publicado_em: "2026-09-12",
    publicado_por: "Administração",
    lido: false,
  },
  {
    id: 3,
    tipo: "ESCALA",
    titulo: "Alteração no ciclo da escala do mês de outubro",
    resumo: "Ajuste pontual no ciclo de outubro; confira o seu turno no calendário.",
    conteudo:
      "Em razão de ajustes administrativos, o ciclo da escala de outubro sofreu alteração pontual nos dias 12 e 13. Recomenda-se consultar a Escala de Serviço para conferir o seu turno e, se necessário, solicitar permuta dentro do prazo.",
    bgo: "188/2026",
    publicado_em: "2026-09-09",
    publicado_por: "Administração",
    lido: true,
  },
  {
    id: 4,
    tipo: "LICENCA",
    titulo: "Licença especial — concessão",
    resumo: "Concessão de licença especial a militares do efetivo, conforme relação.",
    conteudo:
      "Concede-se licença especial aos militares constantes na relação anexa ao boletim, conforme os prazos ali indicados. O retorno ao serviço deve ser comunicado à administração no primeiro dia útil após o término da licença.",
    bgo: "185/2026",
    publicado_em: "2026-09-02",
    publicado_por: "Administração",
    lido: true,
  },
  {
    id: 5,
    tipo: "COMUNICADO",
    titulo: "Atualização cadastral obrigatória",
    resumo: "Todos os militares devem conferir telefone e e-mail no sistema até o fim do mês.",
    conteudo:
      "Solicita-se que todos os militares confiram e mantenham atualizados os seus dados de contato (telefone e e-mail) no sistema. Divergências devem ser comunicadas à administração para correção.",
    bgo: null,
    publicado_em: "2026-08-28",
    publicado_por: "Administração",
    lido: true,
  },
];

// Ponto único de acesso aos dados — trocar por chamada à API depois.
async function carregarBoletins() {
  return BOLETINS_MOCK;
}

const TIPOS = {
  FERIAS: { rotulo: "Férias", icone: Palmtree, cor: "bg-amber-100 text-amber-800 border-amber-200" },
  CURSO: { rotulo: "Curso", icone: GraduationCap, cor: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  ESCALA: { rotulo: "Escala", icone: Calendar, cor: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  LICENCA: { rotulo: "Licença", icone: Users, cor: "bg-sky-100 text-sky-800 border-sky-200" },
  COMUNICADO: { rotulo: "Comunicado", icone: Megaphone, cor: "bg-slate-200 text-slate-700 border-slate-300" },
};

function dataBR(iso) {
  return iso.split("-").reverse().join("/");
}

export default function UserBoletins() {
  const navigate = useNavigate();

  const [boletins, setBoletins] = useState(null);
  const [erro, setErro] = useState(null);
  const [tipo, setTipo] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(null);
  const [lidos, setLidos] = useState(() => new Set());

  useEffect(() => {
    let cancelado = false;
    carregarBoletins()
      .then((dados) => {
        if (!cancelado) setBoletins(dados);
      })
      .catch(() => {
        if (!cancelado) setErro("Não foi possível carregar os boletins.");
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (boletins || [])
      .filter((b) => tipo === "TODOS" || b.tipo === tipo)
      .filter(
        (b) =>
          !termo ||
          b.titulo.toLowerCase().includes(termo) ||
          b.resumo.toLowerCase().includes(termo) ||
          (b.bgo || "").toLowerCase().includes(termo),
      )
      .sort((a, b) => b.publicado_em.localeCompare(a.publicado_em));
  }, [boletins, tipo, busca]);

  const naoLidos = (boletins || []).filter((b) => !b.lido && !lidos.has(b.id)).length;

  function alternar(id) {
    setAberto((atual) => (atual === id ? null : id));
    setLidos((atual) => new Set(atual).add(id));
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Boletins</h1>
            <p className="text-xs text-slate-500 font-mono">
              Comunicados e informações publicados pela administração
            </p>
          </div>
          <button
            onClick={() => navigate("/user")}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition shadow-sm"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          Conteúdo de exemplo: os boletins reais serão publicados pela administração em breve.
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título, assunto ou nº do BGO..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[["TODOS", "Todos"], ...Object.entries(TIPOS).map(([id, t]) => [id, t.rotulo])].map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTipo(id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                tipo === id
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white border-slate-300 text-slate-600 hover:border-emerald-300"
              }`}
            >
              {rotulo}
            </button>
          ))}
          {boletins && (
            <span className="ml-auto text-xs text-slate-400">
              {naoLidos > 0 ? `${naoLidos} não ${naoLidos === 1 ? "lido" : "lidos"} · ` : ""}
              {visiveis.length} {visiveis.length === 1 ? "boletim" : "boletins"}
            </span>
          )}
        </div>

        {erro && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm">{erro}</div>
        )}

        {!erro && boletins === null && (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-emerald-600" />
          </div>
        )}

        {boletins && visiveis.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <FileText className="text-slate-300" size={40} />
            <p className="text-slate-500 text-sm max-w-sm">Nenhum boletim encontrado com esses filtros.</p>
          </div>
        )}

        {visiveis.map((b) => {
          const info = TIPOS[b.tipo] || TIPOS.COMUNICADO;
          const Icone = info.icone;
          const novo = !b.lido && !lidos.has(b.id);
          const expandido = aberto === b.id;

          return (
            <article
              key={b.id}
              className={`bg-white border rounded-xl shadow-sm overflow-hidden ${
                novo ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => alternar(b.id)}
                aria-expanded={expandido}
                className="w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50/70 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${info.cor}`}
                    >
                      <Icone size={12} />
                      {info.rotulo}
                    </span>
                    {novo && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                        Novo
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">{dataBR(b.publicado_em)}</span>
                    {b.bgo && <span className="text-xs text-slate-400 font-mono">BGO {b.bgo}</span>}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">{b.titulo}</h2>
                  {!expandido && <p className="mt-1 text-sm text-slate-500">{b.resumo}</p>}
                </div>
                <ChevronDown
                  size={18}
                  className={`mt-1 flex-shrink-0 text-slate-400 transition-transform ${expandido ? "rotate-180" : ""}`}
                />
              </button>

              {expandido && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <p className="pt-3 text-sm text-slate-700 whitespace-pre-wrap">{b.conteudo}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    Publicado por {b.publicado_por} em {dataBR(b.publicado_em)}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </main>
    </div>
  );
}
