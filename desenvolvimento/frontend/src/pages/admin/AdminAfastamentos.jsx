import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
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

  const [motivos, setMotivos] = useState([]);
  const [novoMotivoTexto, setNovoMotivoTexto] = useState("");

  const [modalForm, setModalForm] = useState(null); // FORM_VAZIO ou dados carregados
  const [modalMilitar, setModalMilitar] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erroForm, setErroForm] = useState(null);

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

  async function encerrar(afastamento) {
    if (
      !window.confirm(
        `Encerrar o afastamento de ${afastamento.nome_guerra || afastamento.nome} (${rotuloTipo(
          afastamento.tipo,
        )})? Isso marca como inativo, mas mantém o histórico.`,
      )
    )
      return;
    try {
      await api.patch(`/afastamentos/${afastamento.id_afastamento}/encerrar`);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível encerrar.");
    }
  }

  async function excluir(afastamento) {
    if (
      !window.confirm(
        `Excluir definitivamente o registro de ${afastamento.nome_guerra || afastamento.nome} (${rotuloTipo(
          afastamento.tipo,
        )})? Essa ação não pode ser desfeita — se for só um retorno antecipado, prefira "Encerrar".`,
      )
    )
      return;
    try {
      await api.delete(`/afastamentos/${afastamento.id_afastamento}`);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível excluir.");
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

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              placeholder="Buscar por nome ou matrícula..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          >
            <option value="true">Ativos</option>
            <option value="false">Encerrados</option>
            <option value="todos">Todos</option>
          </select>
          <button
            onClick={abrirNovo}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition shadow-sm"
          >
            <Plus size={16} />
            Novo
          </button>
        </div>

        {/* Lista */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading && <p className="p-6 text-sm text-slate-400 text-center">Carregando...</p>}
          {!loading && afastamentos.length === 0 && (
            <p className="p-6 text-sm text-slate-400 text-center">Nenhum afastamento encontrado.</p>
          )}
          <div className="divide-y divide-slate-100">
            {afastamentos.map((a) => (
              <div key={a.id_afastamento} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
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
                    {a.modo_restricao && a.turnos?.length > 0 && (
                      <span className="text-[11px] font-mono text-slate-500">
                        {a.modo_restricao === "SOMENTE" ? "Somente" : "Exceto"} turno{" "}
                        {a.turnos.map((t) => t.numero).join("º, ")}º
                      </span>
                    )}
                    {a.grupamentos?.length > 0 && (
                      <span className="text-[11px] font-mono text-slate-500">
                        Equipe {a.grupamentos.map((g) => g.sigla).join(", ")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {(a.nome_guerra || a.nome || "").toUpperCase()}{" "}
                    <span className="font-normal text-slate-500">
                      {a.sigla_patente ? `${a.sigla_patente} · ` : ""}Mat. {a.matricula}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatarDataBR(a.data_inicio)} até {a.data_fim ? formatarDataBR(a.data_fim) : "prazo indeterminado"}
                    {a.bgo_referencia ? ` · BGO ${a.bgo_referencia}` : ""}
                  </p>
                  {a.observacao && <p className="text-xs text-slate-400 mt-0.5 italic">{a.observacao}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => abrirEditar(a)}
                    title="Editar"
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                  >
                    <Pencil size={15} />
                  </button>
                  {a.ativo && (
                    <button
                      onClick={() => encerrar(a)}
                      title="Encerrar (soft — mantém o histórico)"
                      className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition"
                    >
                      <Ban size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => excluir(a)}
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
              fk_id_usuario: u.id,
              militarLabel: `${u.nome_guerra || u.nome} · Mat. ${u.matricula}`,
            }));
            setModalMilitar(false);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Busca simples de militar — mesma fonte de dados (/admin/allusers) e mesmo
// padrão visual do restante do painel, só que sem a lógica de "lotado em
// outro grupamento" (não se aplica aqui: um afastamento é sobre a pessoa,
// não sobre vínculo de escala).
// ---------------------------------------------------------------------------
function ModalBuscaMilitarSimples({ onFechar, onSelecionar }) {
  const [busca, setBusca] = useState("");
  const [usuarios, setUsuarios] = useState(null);

  useEffect(() => {
    api
      .get("/admin/allusers")
      .then(({ data }) => setUsuarios(Array.isArray(data) ? data : []))
      .catch(() => setUsuarios([]));
  }, []);

  const resultados = useMemo(() => {
    if (!usuarios) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios.slice(0, 50);
    return usuarios
      .filter((u) =>
        [u.nome, u.cpf, u.matricula, u.nome_guerra]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(termo)),
      )
      .slice(0, 50);
  }, [busca, usuarios]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative w-full lg:max-w-md bg-white border-t lg:border border-slate-200 rounded-t-2xl lg:rounded-2xl p-5 max-h-[80vh] overflow-y-auto shadow-xl">
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
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, matrícula ou CPF..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          {usuarios === null && <p className="text-xs text-slate-400 py-3 text-center">Carregando...</p>}
          {usuarios !== null && resultados.length === 0 && (
            <p className="text-xs text-slate-400 py-3 text-center">Nenhum militar encontrado.</p>
          )}
          {resultados.map((u) => (
            <button
              key={u.id}
              onClick={() => onSelecionar(u)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition text-left"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-700 truncate">{u.nome}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {u.sigla_patente && u.sigla_patente !== "N/A" ? `${u.sigla_patente} · ` : ""}
                  Mat. {u.matricula}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
