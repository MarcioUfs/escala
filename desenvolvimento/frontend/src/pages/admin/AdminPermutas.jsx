import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeftRight,
  Clock,
  FileText,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import RelatorioPermutas from "../../components/RelatorioPermutas";

function formatarDataBR(dataISO) {
  if (!dataISO) return "---";
  const [ano, mes, dia] = dataISO.slice(0, 10).split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}

function isoLocal(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function somarDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return isoLocal(d);
}

function diferencaDias(inicioISO, fimISO) {
  const [a1, m1, d1] = inicioISO.split("-").map(Number);
  const [a2, m2, d2] = fimISO.split("-").map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

function validarIntervalo(inicio, fim) {
  if (!inicio || !fim) return "Informe a data inicial e a data final.";
  if (fim < inicio) return "A data final não pode ser anterior à data inicial.";
  if (diferencaDias(inicio, fim) > 731) return "O período máximo é de 2 anos.";
  return null;
}

// "Solicitadas" = ainda sem decisão final (aguardando o militar alvo ou o
// administrador); "Aceitas" = aprovadas; "Negadas" = recusadas por qualquer
// um dos dois.
const SITUACOES = [
  { id: "SOLICITADAS", rotulo: "Solicitadas", dica: "em andamento", status: ["AGUARDANDO_ALVO", "AGUARDANDO_ADMIN"] },
  { id: "ACEITAS", rotulo: "Aceitas", dica: "aprovadas", status: ["APROVADA"] },
  { id: "NEGADAS", rotulo: "Negadas", dica: "recusadas", status: ["RECUSADA_ALVO", "RECUSADA_ADMIN"] },
];

const STATUS_INFO = {
  AGUARDANDO_ALVO: { rotulo: "Aguardando confirmação do militar", cor: "bg-amber-100 text-amber-800 ring-amber-300", icone: Clock },
  AGUARDANDO_ADMIN: { rotulo: "Aguardando análise do administrador", cor: "bg-sky-100 text-sky-800 ring-sky-300", icone: Clock },
  APROVADA: { rotulo: "Aceita (aprovada)", cor: "bg-emerald-100 text-emerald-800 ring-emerald-300", icone: CheckCircle2 },
  RECUSADA_ALVO: { rotulo: "Negada pelo militar alvo", cor: "bg-red-100 text-red-800 ring-red-300", icone: XCircle },
  RECUSADA_ADMIN: { rotulo: "Negada pelo administrador", cor: "bg-red-100 text-red-800 ring-red-300", icone: XCircle },
};

const nomeMilitar = (guerra, nome) => guerra || nome;

function CartaoHistorico({ p }) {
  const info = STATUS_INFO[p.status] || STATUS_INFO.AGUARDANDO_ALVO;
  const Icone = info.icone;
  const decidida = ["APROVADA", "RECUSADA_ALVO", "RECUSADA_ADMIN"].includes(p.status);

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-xs font-mono text-slate-400">
          Protocolo {p.protocolo} · solicitada em {new Date(p.created_at).toLocaleDateString("pt-BR")}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${info.cor}`}
        >
          <Icone size={12} />
          {info.rotulo}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
        {[
          { titulo: "Solicitante (serviço permutado)", pat: p.patente_solicitante, mat: p.matricula_solicitante, guerra: p.nome_guerra_solicitante, nome: p.nome_solicitante, data: p.data_solicitante, turno: p.turno_solicitante, grup: p.grupamento_solicitante },
          { titulo: "Alvo (serviço pago)", pat: p.patente_alvo, mat: p.matricula_alvo, guerra: p.nome_guerra_alvo, nome: p.nome_alvo, data: p.data_alvo, turno: p.turno_alvo, grup: p.grupamento_alvo },
        ].map((m) => (
          <div key={m.titulo} className="p-2 bg-slate-50 rounded-lg">
            <p className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">{m.titulo}</p>
            <p className="font-semibold text-slate-700">
              {m.pat ? `${m.pat} ` : ""}
              {nomeMilitar(m.guerra, m.nome)}
            </p>
            <p className="text-xs text-slate-500 font-mono">Mat. {m.mat}</p>
            <p className="text-xs text-slate-500 font-mono">
              {formatarDataBR(m.data)} · {m.turno}º turno · Grup. {m.grup}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Motivo da solicitação: </span>
        {p.motivo_solicitacao}
      </p>
      {p.status === "RECUSADA_ALVO" && (
        <p className="mt-1 text-xs text-red-700">
          <span className="font-semibold">Motivo da negativa: </span>
          {p.motivo_recusa_alvo || "não informado"}
        </p>
      )}
      {p.status === "RECUSADA_ADMIN" && (
        <p className="mt-1 text-xs text-red-700">
          <span className="font-semibold">Motivo da negativa: </span>
          {p.motivo_recusa_admin || "não informado"}
        </p>
      )}
      {decidida && (
        <p className="mt-1 text-[11px] text-slate-400">
          Decisão em {new Date(p.updated_at).toLocaleDateString("pt-BR")}
          {p.status !== "RECUSADA_ALVO" && p.nome_admin_analise ? ` · por ${p.nome_admin_analise}` : ""}
        </p>
      )}
    </div>
  );
}

export default function AdminPermutas() {
  const navigate = useNavigate();
  const [aba, setAba] = useState("pendentes"); // "pendentes" | "historico"

  // ---------------- AGUARDANDO ANÁLISE ----------------
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [processando, setProcessando] = useState(false);

  const [modalRejeitar, setModalRejeitar] = useState(null); // { id_permuta }
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);
      const { data } = await api.get("/permutas/admin/pendentes");
      setPendentes(data || []);
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível carregar as solicitações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aprovar = async (id_permuta) => {
    setProcessando(true);
    setErro(null);
    try {
      await api.put(`/permutas/${id_permuta}/aprovar`);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível aprovar a permuta.");
    } finally {
      setProcessando(false);
    }
  };

  const rejeitar = async () => {
    setProcessando(true);
    setErro(null);
    try {
      await api.put(`/permutas/${modalRejeitar.id_permuta}/rejeitar`, {
        motivo_recusa_admin: motivoRejeicao || undefined,
      });
      setModalRejeitar(null);
      setMotivoRejeicao("");
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível rejeitar a permuta.");
    } finally {
      setProcessando(false);
    }
  };

  // ---------------- HISTÓRICO ----------------
  // Sem escolha do admin, o histórico mostra os últimos 30 e os próximos 30
  // dias. "rascunho" são os campos de data; "consulta" é o que foi de fato
  // buscado (só muda ao clicar em Buscar).
  const [rascunho, setRascunho] = useState({ inicio: somarDias(-30), fim: somarDias(30) });
  const [consulta, setConsulta] = useState(null);
  const [historico, setHistorico] = useState(null); // { permutas, truncado }
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroHistorico, setErroHistorico] = useState(null);
  const [situacoesSel, setSituacoesSel] = useState(() => new Set(SITUACOES.map((s) => s.id)));
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const relatorioRef = useRef(null);

  const erroRascunho = validarIntervalo(rascunho.inicio, rascunho.fim);

  async function buscarHistorico(intervalo) {
    setCarregandoHistorico(true);
    setErroHistorico(null);
    setMostrarRelatorio(false);
    try {
      const { data } = await api.get("/permutas/admin/historico", {
        params: { data_inicio: intervalo.inicio, data_fim: intervalo.fim },
      });
      setHistorico({ permutas: data.permutas || [], truncado: !!data.truncado });
      setConsulta({ inicio: data.data_inicio, fim: data.data_fim });
    } catch (err) {
      setErroHistorico(err.response?.data?.msg || "Não foi possível carregar o histórico.");
    } finally {
      setCarregandoHistorico(false);
    }
  }

  function abrirAba(id) {
    setAba(id);
    // Primeira vez no histórico: já mostra os últimos/próximos 30 dias.
    if (id === "historico" && historico === null && !carregandoHistorico) {
      buscarHistorico(rascunho);
    }
  }

  function aoBuscar(e) {
    e.preventDefault();
    if (erroRascunho) return;
    buscarHistorico(rascunho);
  }

  function alternarSituacao(id) {
    setSituacoesSel((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const contagem = useMemo(() => {
    const c = {};
    for (const s of SITUACOES) c[s.id] = 0;
    for (const p of historico?.permutas || []) {
      const grupo = SITUACOES.find((s) => s.status.includes(p.status));
      if (grupo) c[grupo.id] += 1;
    }
    return c;
  }, [historico]);

  const statusSelecionados = useMemo(
    () => SITUACOES.filter((s) => situacoesSel.has(s.id)).flatMap((s) => s.status),
    [situacoesSel],
  );
  const filtradas = useMemo(
    () => (historico?.permutas || []).filter((p) => statusSelecionados.includes(p.status)),
    [historico, statusSelecionados],
  );
  const rotuloSituacoes = SITUACOES.filter((s) => situacoesSel.has(s.id))
    .map((s) => s.rotulo)
    .join(", ");

  useEffect(() => {
    if (mostrarRelatorio && relatorioRef.current) {
      relatorioRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [mostrarRelatorio]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm print:hidden">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Permutas de Serviço</h1>
            <p className="text-xs text-slate-500 font-mono">
              {aba === "pendentes"
                ? "Já confirmadas pelo militar alvo — aguardando sua análise"
                : "Histórico de solicitações e relatório"}
            </p>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white text-sm font-medium rounded-lg hover:bg-green-900 transition shadow-sm"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>
        <div className="px-4 md:px-8 pb-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
            {[
              { id: "pendentes", rotulo: "Aguardando análise", total: pendentes.length },
              { id: "historico", rotulo: "Histórico", total: null },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => abrirAba(item.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${
                  aba === item.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.rotulo}
                {item.total !== null && !loading && (
                  <span className="ml-1.5 text-xs font-mono text-slate-400">{item.total}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ===================== AGUARDANDO ANÁLISE ===================== */}
      {aba === "pendentes" && (
        <main className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-3 print:hidden">
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-indigo-600" />
            </div>
          )}

          {!loading && erro && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-center gap-3 text-sm">
              <AlertCircle size={18} className="flex-shrink-0" />
              {erro}
            </div>
          )}

          {!loading && !erro && pendentes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <ArrowLeftRight className="text-slate-300" size={40} />
              <p className="text-slate-500 text-sm max-w-sm">Nenhuma permuta aguardando aprovação no momento.</p>
            </div>
          )}

          {!loading &&
            pendentes.map((s) => (
              <div key={s.id_permuta} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono text-slate-400">Protocolo {s.protocolo}</span>
                  <span className="text-[11px] text-slate-400">
                    Solicitado em {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">Solicitante (sai)</p>
                    <p className="font-semibold text-slate-700">{s.nome_guerra_solicitante || s.nome_solicitante}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {formatarDataBR(s.data_solicitante)} · {s.turno_solicitante}º turno · Grup.{" "}
                      {s.grupamento_solicitante}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">Alvo (sai)</p>
                    <p className="font-semibold text-slate-700">{s.nome_guerra_alvo || s.nome_alvo}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {formatarDataBR(s.data_alvo)} · {s.turno_alvo}º turno · Grup. {s.grupamento_alvo}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  <span className="font-semibold text-slate-600">Motivo: </span>
                  {s.motivo_solicitacao}
                </p>

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => aprovar(s.id_permuta)}
                    disabled={processando}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-md transition"
                  >
                    <CheckCircle2 size={13} />
                    Aprovar e incluir na escala
                  </button>
                  <button
                    onClick={() => {
                      setModalRejeitar({ id_permuta: s.id_permuta });
                      setMotivoRejeicao("");
                    }}
                    disabled={processando}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 disabled:opacity-50 text-xs font-bold rounded-md transition"
                  >
                    <XCircle size={13} />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
        </main>
      )}

      {/* ===================== HISTÓRICO ===================== */}
      {aba === "historico" && (
        <main className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-4 print:hidden">
          <form
            onSubmit={aoBuscar}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                De
                <input
                  type="date"
                  value={rascunho.inicio}
                  max={rascunho.fim || undefined}
                  onChange={(e) => setRascunho((r) => ({ ...r, inicio: e.target.value }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Até
                <input
                  type="date"
                  value={rascunho.fim}
                  min={rascunho.inicio || undefined}
                  onChange={(e) => setRascunho((r) => ({ ...r, fim: e.target.value }))}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <button
                type="submit"
                disabled={!!erroRascunho || carregandoHistorico}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search size={15} />
                {carregandoHistorico ? "Buscando..." : "Buscar"}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Considera o dia de serviço de qualquer um dos dois militares. Ao abrir, mostra os últimos 30 e os próximos
              30 dias.
            </p>
            {erroRascunho && (
              <p role="alert" className="text-xs text-red-600">
                {erroRascunho}
              </p>
            )}
          </form>

          {erroHistorico && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-center gap-3 text-sm">
              <AlertCircle size={18} className="flex-shrink-0" />
              {erroHistorico}
            </div>
          )}

          {carregandoHistorico && (
            <div className="flex h-40 items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-indigo-600" />
            </div>
          )}

          {historico && !carregandoHistorico && (
            <>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {historico.permutas.length} {historico.permutas.length === 1 ? "solicitação" : "solicitações"} entre{" "}
                    {formatarDataBR(consulta.inicio)} e {formatarDataBR(consulta.fim)}
                  </p>
                  {historico.truncado && (
                    <p className="text-xs text-amber-700 mt-1">
                      Há mais solicitações do que o limite de exibição. Reduza o período para ver todas.
                    </p>
                  )}
                </div>

                <fieldset>
                  <legend className="text-xs font-semibold text-slate-600 mb-1.5">
                    Situações (escolha uma ou mais para a lista e para o relatório)
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {SITUACOES.map((s) => (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition ${
                          situacoesSel.has(s.id)
                            ? "bg-indigo-50 border-indigo-300 text-indigo-800"
                            : "bg-white border-slate-300 text-slate-600 hover:border-indigo-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={situacoesSel.has(s.id)}
                          onChange={() => alternarSituacao(s.id)}
                          className="rounded border-slate-300"
                        />
                        <span>
                          <span className="font-semibold">{s.rotulo}</span>{" "}
                          <span className="text-xs text-slate-400">({s.dica})</span>
                        </span>
                        <span className="text-xs font-mono text-slate-500">{contagem[s.id]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    {filtradas.length} {filtradas.length === 1 ? "permuta selecionada" : "permutas selecionadas"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMostrarRelatorio(true)}
                    disabled={filtradas.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText size={15} />
                    Gerar relatório
                  </button>
                </div>
                {situacoesSel.size === 0 && (
                  <p className="text-xs text-amber-700">Marque ao menos uma situação para listar e gerar o relatório.</p>
                )}
              </div>

              {filtradas.length === 0 && situacoesSel.size > 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <ArrowLeftRight className="text-slate-300" size={40} />
                  <p className="text-slate-500 text-sm max-w-sm">Nenhuma permuta neste período com as situações escolhidas.</p>
                </div>
              )}

              {filtradas.map((p) => (
                <CartaoHistorico key={p.id_permuta} p={p} />
              ))}
            </>
          )}
        </main>
      )}

      {/* ===================== RELATÓRIO ===================== */}
      {aba === "historico" && historico && mostrarRelatorio && (
        <div ref={relatorioRef} className="scroll-mt-32">
          <RelatorioPermutas
            permutas={filtradas}
            dataInicio={consulta.inicio}
            dataFim={consulta.fim}
            situacoes={rotuloSituacoes || "—"}
          />
        </div>
      )}

      {modalRejeitar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 print:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalRejeitar(null)} />
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800">Rejeitar permuta</h3>
              <button
                onClick={() => setModalRejeitar(null)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">Motivo (opcional) — os dois militares serão avisados.</p>
            <textarea
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              rows={3}
              placeholder="Motivo da rejeição..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setModalRejeitar(null)}
                disabled={processando}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={rejeitar}
                disabled={processando}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
              >
                {processando ? "Enviando..." : "Confirmar rejeição"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botões flutuantes de navegação vertical — mesmo padrão das outras
          telas do admin. Somem na impressão. */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3 print:hidden">
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
