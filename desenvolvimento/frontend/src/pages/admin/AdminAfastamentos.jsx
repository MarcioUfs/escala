import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Plus,
  X,
  Search,
  AlertTriangle,
  Trash2,
  Pencil,
  FileText,
  Ban,
  Check,
  Radio,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

// ---------------------------------------------------------------------------
// Categorias fixas — espelham as seções do boletim oficial do COPOM/PMSE
// usado como referência. "usaTurno" e "usaMotivo" controlam quais campos
// extras aparecem no formulário pra cada tipo (evita mostrar campo que não
// faz sentido pro tipo escolhido — ex: férias não tem turno).
// ---------------------------------------------------------------------------
const TIPOS = [
  { valor: "FERIAS", rotulo: "Férias regulamentares", usaTurno: false, usaMotivo: false },
  { valor: "FERIAS_LEI_109", rotulo: "Férias regulamentares/LE (Lei 109)", usaTurno: false, usaMotivo: false },
  { valor: "LICENCA_ESPECIAL", rotulo: "Licença especial", usaTurno: false, usaMotivo: false },
  { valor: "CURSO", rotulo: "Curso", usaTurno: false, usaMotivo: false },
  { valor: "RESTRICAO_GERAL", rotulo: "Restrição geral", usaTurno: false, usaMotivo: true },
  { valor: "RESTRICAO_NOTURNA", rotulo: "Restrição noturna", usaTurno: true, usaMotivo: true },
  { valor: "ESCALA_DIFERENCIADA", rotulo: "Escala diferenciada", usaTurno: true, usaMotivo: true },
  { valor: "REDUCAO_CARGA", rotulo: "Redução de carga horária", usaTurno: false, usaMotivo: false },
  { valor: "AFASTAMENTO", rotulo: "Afastamento", usaTurno: false, usaMotivo: false },
];

const TURNOS = [
  { id_turno: 1, rotulo: "1º Turno (07h-15h)" },
  { id_turno: 2, rotulo: "2º Turno (15h-23h)" },
  { id_turno: 3, rotulo: "3º Turno (23h-07h)" },
];

const GRUPAMENTOS = [
  { id_grupamento: 1, sigla: "A" },
  { id_grupamento: 2, sigla: "B" },
  { id_grupamento: 3, sigla: "C" },
  { id_grupamento: 4, sigla: "D" },
  { id_grupamento: 5, sigla: "E" },
  { id_grupamento: 6, sigla: "F" },
];

const CORES_TIPO = {
  FERIAS: "bg-amber-100 text-amber-800 border-amber-200",
  FERIAS_LEI_109: "bg-amber-100 text-amber-800 border-amber-200",
  LICENCA_ESPECIAL: "bg-sky-100 text-sky-800 border-sky-200",
  CURSO: "bg-indigo-100 text-indigo-800 border-indigo-200",
  RESTRICAO_GERAL: "bg-slate-200 text-slate-700 border-slate-300",
  RESTRICAO_NOTURNA: "bg-purple-100 text-purple-800 border-purple-200",
  ESCALA_DIFERENCIADA: "bg-rose-100 text-rose-800 border-rose-200",
  REDUCAO_CARGA: "bg-teal-100 text-teal-800 border-teal-200",
  AFASTAMENTO: "bg-orange-100 text-orange-800 border-orange-200",
};

function rotuloTipo(valor) {
  return TIPOS.find((t) => t.valor === valor)?.rotulo || valor;
}

function formatarDataBR(dataISO) {
  if (!dataISO) return null;
  const [ano, mes, dia] = dataISO.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

// "10101010101" -> "101.010.101-01" — mesmo padrão usado no resto do painel.
function formatarCpf(cpf) {
  if (!cpf || cpf.length !== 11) return cpf || "—";
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

// Cabeçalho de coluna clicável — seta ao lado do nome indica se está
// ordenando por essa coluna e em que direção; nas outras colunas a seta
// fica esmaecida (afordance de "dá pra clicar aqui também").
function CabecalhoOrdenavel({ label, coluna, ordenacao, onClick, className }) {
  const ativo = ordenacao.coluna === coluna;
  return (
    <th
      className={`px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide select-none ${className || ""}`}
    >
      <button
        type="button"
        onClick={() => onClick(coluna)}
        className={`flex items-center gap-1 hover:text-slate-800 transition ${ativo ? "text-slate-800" : ""}`}
      >
        {label}
        {ativo ? (
          ordenacao.direcao === "asc" ? (
            <ArrowUp size={12} />
          ) : (
            <ArrowDown size={12} />
          )
        ) : (
          <ArrowUpDown size={12} className="opacity-40" />
        )}
      </button>
    </th>
  );
}

const FORM_VAZIO = {
  id_afastamento: null,
  fk_id_usuario: null,
  militarLabel: "",
  tipo: "FERIAS",
  modo_restricao: "SOMENTE",
  data_inicio: "",
  data_fim: "",
  prazoIndeterminado: false,
  bgo_referencia: "",
  observacao: "",
  turnos: [],
  grupamentos: [],
  motivos: [],
};

export default function AdminAfastamentos() {
  const navigate = useNavigate();

  const [afastamentos, setAfastamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("true");
  const [filtroBusca, setFiltroBusca] = useState("");
  // Ordenação por cabeçalho de coluna (seta ao lado do nome) — "tipo" |
  // "data" | "identificacao". Data começa pela mais recente (padrão que já
  // existia), as outras duas começam A-Z.
  const [ordenacao, setOrdenacao] = useState({ coluna: "data", direcao: "desc" });

  function alternarOrdenacao(coluna) {
    setOrdenacao((o) => {
      if (o.coluna === coluna) return { coluna, direcao: o.direcao === "asc" ? "desc" : "asc" };
      return { coluna, direcao: coluna === "data" ? "desc" : "asc" };
    });
  }

  const [motivos, setMotivos] = useState([]);
  const [novoMotivoTexto, setNovoMotivoTexto] = useState("");

  const [modalForm, setModalForm] = useState(null); // FORM_VAZIO ou dados carregados
  const [modalMilitar, setModalMilitar] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erroForm, setErroForm] = useState(null);
  const [modalEncerrar, setModalEncerrar] = useState(null); // afastamento sendo encerrado, ou null
  const [modalExcluir, setModalExcluir] = useState(null); // afastamento sendo excluído, ou null
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);
      const params = {};
      if (filtroTipo) params.tipo = filtroTipo;
      if (filtroAtivo !== "todos") params.ativo = filtroAtivo;
      if (filtroBusca.trim()) params.busca = filtroBusca.trim();
      const { data } = await api.get("/afastamentos", { params });
      setAfastamentos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível carregar os afastamentos.");
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, filtroAtivo, filtroBusca]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    api
      .get("/afastamentos/motivos")
      .then(({ data }) => setMotivos(Array.isArray(data) ? data : []))
      .catch(() => setMotivos([]));
  }, []);

  // Agrupa por militar — é isso que sustenta "uma linha pra cada
  // afastamento, mas uma linha só pro nome" na tabela: cada grupo vira um
  // bloco de N linhas (uma por afastamento) com a célula de identificação
  // mesclada (rowSpan) cobrindo o bloco inteiro.
  //
  // A ordenação por coluna decide DUAS coisas: (1) a ordem dos GRUPOS
  // (pessoas) e (2) a ordem das sub-linhas DENTRO de cada grupo — exceto
  // quando a coluna ativa é "identificacao", caso em que ordenar por tipo
  // ou data dentro do grupo não faz sentido nenhum pro que o admin pediu,
  // então as sub-linhas ficam pela mais recente primeiro (mesmo padrão de
  // antes).
  const grupos = useMemo(() => {
    const porUsuario = new Map();
    for (const a of afastamentos) {
      if (!porUsuario.has(a.fk_id_usuario)) {
        porUsuario.set(a.fk_id_usuario, {
          fk_id_usuario: a.fk_id_usuario,
          nome: a.nome,
          nome_guerra: a.nome_guerra,
          matricula: a.matricula,
          cpf: a.cpf,
          sigla_patente: a.sigla_patente,
          itens: [],
        });
      }
      porUsuario.get(a.fk_id_usuario).itens.push(a);
    }
    const lista = Array.from(porUsuario.values());
    const dir = ordenacao.direcao === "asc" ? 1 : -1;

    for (const g of lista) {
      if (ordenacao.coluna === "tipo") {
        g.itens.sort((a, b) => dir * rotuloTipo(a.tipo).localeCompare(rotuloTipo(b.tipo), "pt-BR"));
      } else if (ordenacao.coluna === "data") {
        g.itens.sort((a, b) => dir * (a.data_inicio || "").localeCompare(b.data_inicio || ""));
      } else {
        g.itens.sort((a, b) => (b.data_inicio || "").localeCompare(a.data_inicio || ""));
      }
    }

    if (ordenacao.coluna === "identificacao") {
      lista.sort(
        (a, b) => dir * (a.nome_guerra || a.nome || "").localeCompare(b.nome_guerra || b.nome || "", "pt-BR"),
      );
    } else if (ordenacao.coluna === "tipo") {
      lista.sort((a, b) => dir * rotuloTipo(a.itens[0]?.tipo).localeCompare(rotuloTipo(b.itens[0]?.tipo), "pt-BR"));
    } else {
      lista.sort((a, b) => dir * (a.itens[0]?.data_inicio || "").localeCompare(b.itens[0]?.data_inicio || ""));
    }

    return lista;
  }, [afastamentos, ordenacao]);

  const tipoSelecionado = useMemo(
    () => TIPOS.find((t) => t.valor === modalForm?.tipo) || TIPOS[0],
    [modalForm],
  );

  function abrirNovo() {
    setErroForm(null);
    setModalForm({ ...FORM_VAZIO });
  }

  async function abrirEditar(afastamento) {
    setErroForm(null);
    try {
      const { data } = await api.get(`/afastamentos/${afastamento.id_afastamento}`);
      setModalForm({
        id_afastamento: data.id_afastamento,
        fk_id_usuario: data.fk_id_usuario,
        militarLabel: `${afastamento.nome_guerra || afastamento.nome} · Mat. ${afastamento.matricula}`,
        tipo: data.tipo,
        modo_restricao: data.modo_restricao || "SOMENTE",
        data_inicio: (data.data_inicio || "").slice(0, 10),
        data_fim: (data.data_fim || "").slice(0, 10),
        prazoIndeterminado: !data.data_fim,
        bgo_referencia: data.bgo_referencia || "",
        observacao: data.observacao || "",
        turnos: data.turnos || [],
        grupamentos: data.grupamentos || [],
        motivos: data.motivos || [],
      });
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível abrir esse afastamento para edição.");
    }
  }

  function fecharModal() {
    setModalForm(null);
    setErroForm(null);
  }

  function alternarValor(campo, valor) {
    setModalForm((f) => {
      const lista = f[campo].includes(valor) ? f[campo].filter((v) => v !== valor) : [...f[campo], valor];
      return { ...f, [campo]: lista };
    });
  }

  async function adicionarMotivoNovo() {
    const descricao = novoMotivoTexto.trim();
    if (descricao.length < 3) return;
    try {
      const { data } = await api.post("/afastamentos/motivos", { descricao });
      setMotivos((m) => (m.some((x) => x.id_motivo_restricao === data.id_motivo_restricao) ? m : [...m, data]));
      alternarValor("motivos", data.id_motivo_restricao);
      setNovoMotivoTexto("");
    } catch (err) {
      setErroForm(err.response?.data?.msg || "Não foi possível adicionar esse motivo.");
    }
  }

  async function salvar(e) {
    e.preventDefault();
    if (!modalForm.fk_id_usuario) {
      setErroForm("Selecione um militar.");
      return;
    }
    if (!modalForm.data_inicio) {
      setErroForm("Informe a data de início.");
      return;
    }

    const payload = {
      fk_id_usuario: modalForm.fk_id_usuario,
      tipo: modalForm.tipo,
      data_inicio: modalForm.data_inicio,
      data_fim: modalForm.prazoIndeterminado ? null : modalForm.data_fim || null,
      bgo_referencia: modalForm.bgo_referencia || null,
      observacao: modalForm.observacao || null,
      turnos: tipoSelecionado.usaTurno ? modalForm.turnos : [],
      modo_restricao: tipoSelecionado.usaTurno && modalForm.turnos.length > 0 ? modalForm.modo_restricao : null,
      grupamentos: tipoSelecionado.usaTurno ? modalForm.grupamentos : [],
      motivos: tipoSelecionado.usaMotivo ? modalForm.motivos : [],
    };

    setProcessando(true);
    setErroForm(null);
    try {
      if (modalForm.id_afastamento) {
        await api.put(`/afastamentos/${modalForm.id_afastamento}`, payload);
      } else {
        await api.post("/afastamentos", payload);
      }
      fecharModal();
      await carregar();
    } catch (err) {
      setErroForm(err.response?.data?.msg || "Não foi possível salvar o afastamento.");
    } finally {
      setProcessando(false);
    }
  }

  function abrirEncerrar(afastamento) {
    setModalEncerrar(afastamento);
  }

  async function confirmarEncerramento(payload) {
    await api.patch(`/afastamentos/${modalEncerrar.id_afastamento}/encerrar`, payload);
    setModalEncerrar(null);
    await carregar();
  }

  function abrirExcluir(afastamento) {
    setErroExcluir(null);
    setModalExcluir(afastamento);
  }

  async function confirmarExclusao() {
    setExcluindo(true);
    setErroExcluir(null);
    try {
      await api.delete(`/afastamentos/${modalExcluir.id_afastamento}`);
      setModalExcluir(null);
      await carregar();
    } catch (err) {
      setErroExcluir(err.response?.data?.msg || "Não foi possível excluir.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              Afastamentos e Restrições
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Férias, licenças, cursos e restrições de serviço — informativo, não bloqueia a escala
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin/escala")}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition shadow-sm"
            >
              <Radio size={16} />
              <span className="hidden sm:inline">Escala</span>
            </button>
            <button
              onClick={() => navigate("/admin/boletim-efetivo")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">Boletim do efetivo</span>
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white text-sm font-medium rounded-lg hover:bg-green-900 transition shadow-sm"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            {erro}
          </div>
        )}

        {/* Filtros — busca isolada numa linha própria (heurística de Nielsen:
            liberdade e controle do usuário, o campo mais usado fica óbvio e
            não disputa espaço com os selects em telas estreitas) + tipo e
            status agrupados abaixo, que quebram linha sozinhos conforme a
            largura disponível. Ordenar agora é pelo cabeçalho da tabela
            (seta ao lado do nome da coluna), não mais um select à parte. */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                placeholder="Buscar por nome ou matrícula..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={abrirNovo}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition shadow-sm sm:flex-shrink-0"
            >
              <Plus size={16} />
              Novo
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Filtrar por tipo"
            >
              <option value="">Todos os tipos</option>
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.rotulo}
                </option>
              ))}
            </select>
            <select
              value={filtroAtivo}
              onChange={(e) => setFiltroAtivo(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Filtrar por status"
            >
              <option value="true">Ativos</option>
              <option value="false">Encerrados</option>
              <option value="todos">Todos</option>
            </select>
            {!loading && (
              <span className="text-xs text-slate-400 ml-auto">
                {afastamentos.length} {afastamentos.length === 1 ? "registro" : "registros"}
              </span>
            )}
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading && <p className="p-6 text-sm text-slate-400 text-center">Carregando...</p>}
          {!loading && grupos.length === 0 && (
            <p className="p-6 text-sm text-slate-400 text-center">Nenhum afastamento encontrado.</p>
          )}

          {!loading && grupos.length > 0 && (
            <>
              {/* ---------- DESKTOP (lg+): tabela de verdade, com a célula
                  de identificação mesclada (rowSpan) quando o militar tem
                  mais de um afastamento — é isso que "consta" visualmente
                  que ele tem mais de um, sem precisar de selo repetido. */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <CabecalhoOrdenavel
                        label="Tipo"
                        coluna="tipo"
                        ordenacao={ordenacao}
                        onClick={alternarOrdenacao}
                      />
                      <CabecalhoOrdenavel
                        label="Data / Intervalo"
                        coluna="data"
                        ordenacao={ordenacao}
                        onClick={alternarOrdenacao}
                      />
                      <CabecalhoOrdenavel
                        label="Identificação"
                        coluna="identificacao"
                        ordenacao={ordenacao}
                        onClick={alternarOrdenacao}
                        className="border-l border-slate-200"
                      />
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupos.map((g, gIdx) =>
                      g.itens.map((a, idx) => {
                        // Linha de baixo de CADA militar (não de cada
                        // afastamento) ganha uma borda mais grossa/escura —
                        // sem isso, quando alguém tem 2+ restrições, é fácil
                        // achar que a linha seguinte (já de outro militar)
                        // ainda é da mesma pessoa. Dentro do bloco de um
                        // mesmo militar a borda continua fina, só pra
                        // separar visualmente os afastamentos dele.
                        const ultimaDoGrupo = idx === g.itens.length - 1;
                        const ultimoGrupo = gIdx === grupos.length - 1;
                        const classeBorda = ultimaDoGrupo
                          ? ultimoGrupo
                            ? ""
                            : "border-b-2 border-slate-300"
                          : "border-b border-slate-100";
                        return (
                          <tr
                            key={a.id_afastamento}
                            className={`${classeBorda} hover:bg-slate-50/70 align-top`}
                          >
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                  CORES_TIPO[a.tipo] || "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {rotuloTipo(a.tipo)}
                              </span>
                              {!a.ativo && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                  Encerrado
                                </span>
                              )}
                            </div>
                            {((a.modo_restricao && a.turnos?.length > 0) || a.grupamentos?.length > 0) && (
                              <p className="text-[11px] font-mono text-slate-500 mt-1">
                                {a.modo_restricao && a.turnos?.length > 0 &&
                                  `${a.modo_restricao === "SOMENTE" ? "Somente" : "Exceto"} turno ${a.turnos
                                    .map((t) => t.numero)
                                    .join("º, ")}º`}
                                {a.modo_restricao && a.turnos?.length > 0 && a.grupamentos?.length > 0 && " · "}
                                {a.grupamentos?.length > 0 && `Equipe ${a.grupamentos.map((eq) => eq.sigla).join(", ")}`}
                              </p>
                            )}
                            {a.observacao && (
                              <p className="text-xs text-slate-400 italic mt-1">{a.observacao}</p>
                            )}
                            {!a.ativo && a.data_encerramento && (
                              <p className="text-[11px] text-slate-400 font-mono mt-1" title={a.motivo_encerramento || ""}>
                                Encerrado em {formatarDataBR(a.data_encerramento)}
                                {a.bgo_encerramento ? ` · BGO ${a.bgo_encerramento}` : ""}
                                {a.nome_admin_encerramento ? ` · por ${a.nome_admin_encerramento}` : ""}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <p className="text-slate-700">
                              {formatarDataBR(a.data_inicio)} até{" "}
                              {a.data_fim ? (
                                formatarDataBR(a.data_fim)
                              ) : (
                                <span className="italic text-slate-500">prazo indeterminado</span>
                              )}
                            </p>
                            {a.bgo_referencia && (
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">BGO {a.bgo_referencia}</p>
                            )}
                          </td>
                          {idx === 0 && (
                            <td
                              className="px-3 py-2.5 border-l border-slate-100 whitespace-nowrap"
                              rowSpan={g.itens.length}
                            >
                              <p className="text-sm font-semibold text-slate-800">
                                {g.sigla_patente ? `${g.sigla_patente} ` : ""}
                                {(g.nome_guerra || g.nome || "").toUpperCase()}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                CPF {formatarCpf(g.cpf)} · Mat. {g.matricula}
                              </p>
                            </td>
                          )}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => abrirEditar(a)}
                                title="Editar"
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                              >
                                <Pencil size={14} />
                              </button>
                              {a.ativo && (
                                <button
                                  onClick={() => abrirEncerrar(a)}
                                  title="Encerrar (soft — mantém o histórico)"
                                  className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"
                                >
                                  <Ban size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => abrirExcluir(a)}
                                title="Excluir definitivamente"
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      }),
                    )}
                  </tbody>
                </table>
              </div>

              {/* ---------- TABLET/MOBILE (< lg): cards agrupados por
                  militar — o nome aparece uma vez só no topo do bloco,
                  cada afastamento dele vira um cartãozinho abaixo. Ações
                  ganham espaço próprio (alvo de toque melhor que ícone
                  espremido numa linha só). */}
              <div className="lg:hidden divide-y divide-slate-100">
                {grupos.map((g) => (
                  <div key={g.fk_id_usuario} className="p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {g.sigla_patente ? `${g.sigla_patente} ` : ""}
                      {(g.nome_guerra || g.nome || "").toUpperCase()}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mb-2">
                      CPF {formatarCpf(g.cpf)} · Mat. {g.matricula}
                    </p>
                    <div className="space-y-2">
                      {g.itens.map((a) => (
                        <div key={a.id_afastamento} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                CORES_TIPO[a.tipo] || "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {rotuloTipo(a.tipo)}
                            </span>
                            {!a.ativo && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                Encerrado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">
                            {formatarDataBR(a.data_inicio)} até{" "}
                            {a.data_fim ? formatarDataBR(a.data_fim) : "prazo indeterminado"}
                            {a.bgo_referencia ? ` · BGO ${a.bgo_referencia}` : ""}
                          </p>
                          {((a.modo_restricao && a.turnos?.length > 0) || a.grupamentos?.length > 0) && (
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                              {a.modo_restricao && a.turnos?.length > 0 &&
                                `${a.modo_restricao === "SOMENTE" ? "Somente" : "Exceto"} turno ${a.turnos
                                  .map((t) => t.numero)
                                  .join("º, ")}º`}
                              {a.modo_restricao && a.turnos?.length > 0 && a.grupamentos?.length > 0 && " · "}
                              {a.grupamentos?.length > 0 && `Equipe ${a.grupamentos.map((eq) => eq.sigla).join(", ")}`}
                            </p>
                          )}
                          {a.observacao && (
                            <p className="text-xs text-slate-400 italic mt-0.5">{a.observacao}</p>
                          )}
                          {!a.ativo && a.data_encerramento && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5" title={a.motivo_encerramento || ""}>
                              Encerrado em {formatarDataBR(a.data_encerramento)}
                              {a.bgo_encerramento ? ` · BGO ${a.bgo_encerramento}` : ""}
                              {a.nome_admin_encerramento ? ` · por ${a.nome_admin_encerramento}` : ""}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-2">
                            <button
                              onClick={() => abrirEditar(a)}
                              title="Editar"
                              className="p-2 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition"
                            >
                              <Pencil size={15} />
                            </button>
                            {a.ativo && (
                              <button
                                onClick={() => abrirEncerrar(a)}
                                title="Encerrar (soft — mantém o histórico)"
                                className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition"
                              >
                                <Ban size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => abrirExcluir(a)}
                              title="Excluir definitivamente"
                              className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ===================== MODAL FORMULÁRIO ===================== */}
      {modalForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={fecharModal} />
          <form
            onSubmit={salvar}
            className="relative w-full lg:max-w-xl bg-white border-t lg:border border-slate-200 rounded-t-2xl lg:rounded-2xl p-5 max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">
                {modalForm.id_afastamento ? "Editar afastamento" : "Novo afastamento"}
              </h2>
              <button
                type="button"
                onClick={fecharModal}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {erroForm && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {erroForm}
              </div>
            )}

            <div className="space-y-4">
              {/* Militar */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Militar</label>
                <button
                  type="button"
                  onClick={() => setModalMilitar(true)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg text-sm text-left hover:border-indigo-400 transition"
                >
                  <span className={modalForm.militarLabel ? "text-slate-700" : "text-slate-400"}>
                    {modalForm.militarLabel || "Selecionar militar..."}
                  </span>
                  <Search size={14} className="text-slate-400" />
                </button>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo</label>
                <select
                  value={modalForm.tipo}
                  onChange={(e) => setModalForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {TIPOS.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.rotulo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Início</label>
                  <input
                    type="date"
                    value={modalForm.data_inicio}
                    onChange={(e) => setModalForm((f) => ({ ...f, data_inicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fim</label>
                  <input
                    type="date"
                    value={modalForm.data_fim}
                    disabled={modalForm.prazoIndeterminado}
                    onChange={(e) => setModalForm((f) => ({ ...f, data_fim: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <label className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={modalForm.prazoIndeterminado}
                      onChange={(e) =>
                        setModalForm((f) => ({ ...f, prazoIndeterminado: e.target.checked, data_fim: "" }))
                      }
                    />
                    Prazo indeterminado
                  </label>
                </div>
              </div>

              {/* Turno + modo (só pra tipos com turno) */}
              {tipoSelecionado.usaTurno && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Turno(s) restrito(s) — deixe vazio se a restrição não depende do turno
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {TURNOS.map((t) => (
                      <label
                        key={t.id_turno}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                          modalForm.turnos.includes(t.id_turno)
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "bg-white border-slate-300 text-slate-600 hover:border-purple-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={modalForm.turnos.includes(t.id_turno)}
                          onChange={() => alternarValor("turnos", t.id_turno)}
                        />
                        {t.rotulo}
                      </label>
                    ))}
                  </div>
                  {modalForm.turnos.length > 0 && (
                    <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
                      <span className="font-semibold">Modo:</span>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="modo_restricao"
                          checked={modalForm.modo_restricao === "SOMENTE"}
                          onChange={() => setModalForm((f) => ({ ...f, modo_restricao: "SOMENTE" }))}
                        />
                        Somente esse(s) turno(s)
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="modo_restricao"
                          checked={modalForm.modo_restricao === "EXCETO"}
                          onChange={() => setModalForm((f) => ({ ...f, modo_restricao: "EXCETO" }))}
                        />
                        Exceto esse(s) turno(s)
                      </label>
                    </div>
                  )}

                  <label className="block text-xs font-semibold text-slate-600 mb-2 mt-3">
                    Equipe(s) — deixe vazio para aplicar a qualquer equipe
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GRUPAMENTOS.map((g) => (
                      <label
                        key={g.id_grupamento}
                        className={`flex items-center justify-center size-8 rounded-lg border text-xs font-bold cursor-pointer transition ${
                          modalForm.grupamentos.includes(g.id_grupamento)
                            ? "bg-slate-800 border-slate-800 text-white"
                            : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={modalForm.grupamentos.includes(g.id_grupamento)}
                          onChange={() => alternarValor("grupamentos", g.id_grupamento)}
                        />
                        {g.sigla}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Motivos (select múltiplo + adicionar novo) */}
              {tipoSelecionado.usaMotivo && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Motivo(s) da restrição
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {motivos.map((m) => (
                      <label
                        key={m.id_motivo_restricao}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                          modalForm.motivos.includes(m.id_motivo_restricao)
                            ? "bg-slate-800 border-slate-800 text-white"
                            : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={modalForm.motivos.includes(m.id_motivo_restricao)}
                          onChange={() => alternarValor("motivos", m.id_motivo_restricao)}
                        />
                        {m.descricao}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      value={novoMotivoTexto}
                      onChange={(e) => setNovoMotivoTexto(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          adicionarMotivoNovo();
                        }
                      }}
                      placeholder="Adicionar novo motivo..."
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={adicionarMotivoNovo}
                      className="px-2.5 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* BGO + observação */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">BGO (opcional)</label>
                <input
                  value={modalForm.bgo_referencia}
                  onChange={(e) => setModalForm((f) => ({ ...f, bgo_referencia: e.target.value }))}
                  placeholder="Ex: 181/2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Observação (opcional) — ex: horário reduzido (&quot;até às 13h&quot;)
                </label>
                <textarea
                  value={modalForm.observacao}
                  onChange={(e) => setModalForm((f) => ({ ...f, observacao: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={fecharModal}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={processando}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Check size={15} />
                {processando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== MODAL BUSCA MILITAR ===================== */}
      {modalMilitar && (
        <ModalBuscaMilitarSimples
          onFechar={() => setModalMilitar(false)}
          onSelecionar={(u) => {
            setModalForm((f) => ({
              ...f,
              fk_id_usuario: u.id, // "/admin/allusers" já mapeia id_user -> id na resposta
              militarLabel: `${u.nome_guerra || u.nome} · Mat. ${u.matricula}`,
            }));
            setModalMilitar(false);
          }}
        />
      )}

      {/* ===================== MODAL ENCERRAR AFASTAMENTO ===================== */}
      {modalEncerrar && (
        <ModalEncerrarAfastamento
          afastamento={modalEncerrar}
          onFechar={() => setModalEncerrar(null)}
          onConfirmar={confirmarEncerramento}
        />
      )}

      {/* ===================== MODAL CONFIRMAR EXCLUSÃO ===================== */}
      {modalExcluir && (
        <ModalConfirmacao
          titulo="Excluir definitivamente"
          descricao={`Excluir definitivamente o registro de ${
            modalExcluir.nome_guerra || modalExcluir.nome
          } (${rotuloTipo(modalExcluir.tipo)})? Essa ação não pode ser desfeita — se for só um retorno antecipado, prefira "Encerrar".`}
          confirmando={excluindo}
          erro={erroExcluir}
          rotuloConfirmar="Excluir"
          rotuloProcessando="Excluindo..."
          onCancelar={() => {
            setModalExcluir(null);
            setErroExcluir(null);
          }}
          onConfirmar={confirmarExclusao}
        />
      )}

      {/* Botões flutuantes de navegação vertical — mesmo padrão de
          /admin/escala. */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Voltar ao topo"
          aria-label="Voltar ao topo"
          className="flex items-center justify-center size-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition"
        >
          <ArrowUp size={20} />
        </button>
        <button
          type="button"
          onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
          title="Descer uma página"
          aria-label="Descer uma página"
          className="flex items-center justify-center size-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition"
        >
          <ArrowDown size={20} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Busca simples de militar — mesma fonte de dados (/admin/allusers, que já
// inclui o CPF) e mesmo padrão visual do restante do painel, só que sem a
// lógica de "lotado em outro grupamento" (não se aplica aqui: um
// afastamento é sobre a pessoa, não sobre vínculo de escala).
//
// Lista sempre em ordem alfabética (por nome de guerra), com CPF junto da
// matrícula e — abaixo do nome — as restrições/afastamentos ATIVOS que o
// militar já tem agora, pra evitar cadastrar duplicado sem querer e pra
// dar contexto na hora de escolher. É uma busca separada de
// /afastamentos?ativo=true, independente dos filtros da tela principal
// (mostra o estado real, não o que porventura estiver filtrado lá atrás).
// ---------------------------------------------------------------------------
const TAMANHO_PAGINA_MILITAR = 50;

function ModalBuscaMilitarSimples({ onFechar, onSelecionar }) {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [usuarios, setUsuarios] = useState(null);
  const [restricoesPorUsuario, setRestricoesPorUsuario] = useState(new Map());

  useEffect(() => {
    api
      .get("/admin/allusers")
      .then(({ data }) => setUsuarios(Array.isArray(data) ? data : []))
      .catch(() => setUsuarios([]));
    api
      .get("/afastamentos", { params: { ativo: "true" } })
      .then(({ data }) => {
        const mapa = new Map();
        (Array.isArray(data) ? data : []).forEach((a) => {
          const lista = mapa.get(a.fk_id_usuario) || [];
          lista.push(a.tipo);
          mapa.set(a.fk_id_usuario, lista);
        });
        setRestricoesPorUsuario(mapa);
      })
      .catch(() => setRestricoesPorUsuario(new Map()));
  }, []);

  const usuariosOrdenados = useMemo(() => {
    if (!usuarios) return null;
    return [...usuarios].sort((a, b) =>
      (a.nome_guerra || a.nome || "").localeCompare(b.nome_guerra || b.nome || "", "pt-BR"),
    );
  }, [usuarios]);

  // CPF e matrícula vêm formatados (com ponto/traço) de /admin/allusers —
  // comparando só os DÍGITOS dos dois lados, a busca funciona digitando
  // com ou sem pontuação, exatamente como consta no dado ou só os números.
  const listaFiltrada = useMemo(() => {
    if (!usuariosOrdenados) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuariosOrdenados;
    const termoDigitos = termo.replace(/\D/g, "");
    return usuariosOrdenados.filter((u) => {
      const nomeBate = [u.nome, u.nome_guerra].some(
        (v) => v && v.toLowerCase().includes(termo),
      );
      const cpfBate = termoDigitos && String(u.cpf || "").replace(/\D/g, "").includes(termoDigitos);
      const matBate = termoDigitos && String(u.matricula || "").replace(/\D/g, "").includes(termoDigitos);
      return nomeBate || cpfBate || matBate;
    });
  }, [busca, usuariosOrdenados]);

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / TAMANHO_PAGINA_MILITAR));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const resultados = listaFiltrada.slice(
    (paginaAtual - 1) * TAMANHO_PAGINA_MILITAR,
    paginaAtual * TAMANHO_PAGINA_MILITAR,
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative w-full lg:max-w-2xl bg-white border-t lg:border border-slate-200 rounded-t-2xl lg:rounded-2xl p-5 max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">Selecionar militar</h2>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder="Nome, matrícula ou CPF..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          {usuarios === null && <p className="text-xs text-slate-400 py-3 text-center">Carregando...</p>}
          {usuarios !== null && resultados.length === 0 && (
            <p className="text-xs text-slate-400 py-3 text-center">Nenhum militar encontrado.</p>
          )}
          {resultados.map((u) => {
            const restricoes = restricoesPorUsuario.get(u.id) || [];
            return (
              <button
                key={u.id}
                onClick={() => onSelecionar(u)}
                className="w-full flex flex-col gap-1 px-3 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition text-left"
              >
                {/* Tenta caber posto + nome + CPF + matrícula numa linha
                    só — o modal ficou mais largo em telas grandes (lg:max-w-2xl)
                    exatamente pra isso; se não couber, o flex-wrap quebra
                    sozinho pra uma segunda linha. */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-slate-700">
                    {u.sigla_patente && u.sigla_patente !== "N/A" ? `${u.sigla_patente} ` : ""}
                    {(u.nome_guerra || u.nome || "").toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {/* /admin/allusers já devolve CPF e matrícula formatados
                        (000.000.000-00 / com traço) — sem reformatar aqui,
                        senão sai errado (dado já formatado formatado de
                        novo). */}
                    CPF {u.cpf || "—"} · Mat. {u.matricula}
                  </span>
                </div>
                {restricoes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {restricoes.map((tipo, i) => (
                      <span
                        key={i}
                        className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          CORES_TIPO[tipo] || "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {rotuloTipo(tipo)}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {listaFiltrada.length > TAMANHO_PAGINA_MILITAR && (
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              {(paginaAtual - 1) * TAMANHO_PAGINA_MILITAR + 1}–
              {Math.min(paginaAtual * TAMANHO_PAGINA_MILITAR, listaFiltrada.length)} de {listaFiltrada.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Página anterior"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-1 font-mono">
                {paginaAtual}/{totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Próxima página"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const LIMITE_PALAVRAS_MOTIVO_ENCERRAMENTO = 500;
const ANO_ATUAL = new Date().getFullYear();

// Modal de encerramento manual — pede um registro formal (data, BGO,
// motivo) em vez do window.confirm genérico de antes. "Responsável" é
// sempre o admin autenticado (buscado uma vez via /admin/getadmin), não um
// campo editável — é só a confirmação de quem está executando a ação.
function ModalEncerrarAfastamento({ afastamento, onFechar, onConfirmar }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const dataMinima = (afastamento.data_inicio || "").slice(0, 10);

  const [dataEncerramento, setDataEncerramento] = useState(
    dataMinima && hoje < dataMinima ? dataMinima : hoje,
  );
  const [bgoNumero, setBgoNumero] = useState("");
  const [bgoAno, setBgoAno] = useState(String(ANO_ATUAL));
  const [motivo, setMotivo] = useState("");
  const [adminNome, setAdminNome] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [erroLocal, setErroLocal] = useState(null);

  useEffect(() => {
    api
      .get("/admin/getadmin")
      .then(({ data }) => setAdminNome(data?.nome || null))
      .catch(() => setAdminNome(null));
  }, []);

  const palavras = motivo.trim() ? motivo.trim().split(/\s+/).filter(Boolean) : [];
  const palavrasRestantes = LIMITE_PALAVRAS_MOTIVO_ENCERRAMENTO - palavras.length;
  const bgoPreview = /^\d{3}$/.test(bgoNumero) && /^\d{4}$/.test(bgoAno) ? `${bgoNumero}/${bgoAno}` : null;

  async function enviar(e) {
    e.preventDefault();
    setErroLocal(null);

    if (!dataEncerramento) {
      setErroLocal("Informe a data do encerramento.");
      return;
    }
    if (dataMinima && dataEncerramento < dataMinima) {
      setErroLocal("Data do encerramento não pode ser anterior à data de início do afastamento.");
      return;
    }
    if (!/^\d{3}$/.test(bgoNumero) || Number(bgoNumero) < 1) {
      setErroLocal("Número do BGO deve ter 3 dígitos, de 001 a 999.");
      return;
    }
    if (!/^\d{4}$/.test(bgoAno) || Number(bgoAno) > ANO_ATUAL) {
      setErroLocal(`Ano do BGO deve ter 4 dígitos e não pode ser maior que ${ANO_ATUAL}.`);
      return;
    }
    if (!motivo.trim()) {
      setErroLocal("Informe o motivo do encerramento.");
      return;
    }
    if (palavras.length > LIMITE_PALAVRAS_MOTIVO_ENCERRAMENTO) {
      setErroLocal(`Motivo do encerramento não pode passar de ${LIMITE_PALAVRAS_MOTIVO_ENCERRAMENTO} palavras.`);
      return;
    }

    setProcessando(true);
    try {
      await onConfirmar({
        data_encerramento: dataEncerramento,
        bgo_numero: bgoNumero,
        bgo_ano: bgoAno,
        motivo_encerramento: motivo.trim(),
      });
    } catch (err) {
      setErroLocal(err.response?.data?.msg || "Não foi possível encerrar.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <form
        onSubmit={enviar}
        className="relative w-full lg:max-w-md bg-white border-t lg:border border-slate-200 rounded-t-2xl lg:rounded-2xl p-5 max-h-[90vh] overflow-y-auto shadow-xl"
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-base font-bold text-slate-800">Encerrar afastamento</h2>
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          {afastamento.sigla_patente ? `${afastamento.sigla_patente} ` : ""}
          {(afastamento.nome_guerra || afastamento.nome || "").toUpperCase()} ·{" "}
          {rotuloTipo(afastamento.tipo)}
        </p>

        {erroLocal && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {erroLocal}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Data do encerramento</label>
            <input
              type="date"
              value={dataEncerramento}
              min={dataMinima || undefined}
              onChange={(e) => setDataEncerramento(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">BGO de referência</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="002"
                value={bgoNumero}
                onChange={(e) => setBgoNumero(e.target.value.replace(/\D/g, "").slice(0, 3))}
                maxLength={3}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="text-slate-400 font-mono">/</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={String(ANO_ATUAL)}
                value={bgoAno}
                onChange={(e) => setBgoAno(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {bgoPreview && (
                <span className="text-xs text-slate-400 font-mono ml-auto">→ {bgoPreview}</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600">Motivo do encerramento</label>
              <span className={`text-[11px] font-mono ${palavrasRestantes < 0 ? "text-red-600" : "text-slate-400"}`}>
                {palavrasRestantes < 0 ? `${-palavrasRestantes} palavras acima do limite` : `${palavrasRestantes} palavras restantes`}
              </span>
            </div>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              placeholder="Ex: militar retornou antes do previsto"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
          </div>

          <div className="pt-1 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 mt-2">
              Responsável: <span className="text-slate-600 font-medium">{adminNome || "carregando..."}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={processando}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-50"
          >
            <Ban size={15} />
            {processando ? "Encerrando..." : "Encerrar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Modal de confirmação genérico (mesmo padrão usado em /admin/escala) —
// substitui o window.confirm() que existia antes na exclusão definitiva.
function ModalConfirmacao({
  titulo,
  descricao,
  confirmando,
  erro,
  rotuloConfirmar = "Confirmar",
  rotuloProcessando = "Processando...",
  onCancelar,
  onConfirmar,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancelar} />
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-slate-800 mb-2">{titulo}</h3>
        <p className="text-sm text-slate-500 mb-5">{descricao}</p>
        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{erro}</div>
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancelar}
            disabled={confirmando}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={confirmando}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
          >
            {confirmando ? rotuloProcessando : rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
