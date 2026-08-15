import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeftRight,
  AlertCircle,
  ShieldCheck,
  Send,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../contexts/AuthContext";

// Mesma paleta usada no painel do admin (AdminEscala.jsx) — mantém a
// leitura visual consistente entre os dois portais.
const CORES_GRUPAMENTO = [
  { bg: "bg-amber-100", text: "text-black", ring: "ring-amber-300", dot: "bg-amber-500" },
  { bg: "bg-sky-100", text: "text-black", ring: "ring-sky-300", dot: "bg-sky-500" },
  { bg: "bg-emerald-100", text: "text-black", ring: "ring-emerald-300", dot: "bg-emerald-500" },
  { bg: "bg-fuchsia-100", text: "text-black", ring: "ring-fuchsia-300", dot: "bg-fuchsia-500" },
  { bg: "bg-orange-100", text: "text-black", ring: "ring-orange-300", dot: "bg-orange-500" },
  { bg: "bg-teal-100", text: "text-black", ring: "ring-teal-300", dot: "bg-teal-500" },
  { bg: "bg-rose-100", text: "text-black", ring: "ring-rose-300", dot: "bg-rose-500" },
  { bg: "bg-indigo-100", text: "text-black", ring: "ring-indigo-300", dot: "bg-indigo-500" },
];
const DIAS_SEMANA_CURTO = ["D", "S", "T", "Q", "Q", "S", "S"];

function corDoGrupamento(sigla, mapaCores) {
  return mapaCores.get(sigla) || CORES_GRUPAMENTO[0];
}

// mesma correção de fuso horário do AdminEscala.jsx — evita o "buraco" de
// 1 dia que `new Date("2026-08-01")` causa em fusos negativos.
function parseDataLocal(dataStr) {
  const [ano, mes, dia] = dataStr.slice(0, 10).split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarMesReferencia(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${mm}/${date.getFullYear()}`;
}

function nomeDoMes(date) {
  return date
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function chaveISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function agruparPorDia(escalas) {
  const mapa = new Map();
  for (const linha of escalas) {
    const chave = (linha.data || "").slice(0, 10);
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave).push(linha);
  }
  for (const turnos of mapa.values()) {
    turnos.sort((a, b) => a.turno - b.turno);
  }
  return mapa;
}

function montarSemanas(dataInicioStr, dataFimStr) {
  const inicio = parseDataLocal(dataInicioStr);
  const fim = parseDataLocal(dataFimStr);
  const inicioAjustado = new Date(inicio);
  inicioAjustado.setDate(inicioAjustado.getDate() - inicioAjustado.getDay());

  const semanas = [];
  let cursor = new Date(inicioAjustado);
  while (cursor <= fim) {
    const semana = [];
    for (let i = 0; i < 7; i++) {
      semana.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

function formatarDataBR(dataISO) {
  return parseDataLocal(dataISO).toLocaleDateString("pt-BR");
}

export default function UserEscala() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const meuId = user?.id;

  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [escalas, setEscalas] = useState([]);
  const [periodo, setPeriodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregarEscalas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post("/minha-escala/listar/periodo-estendido", {
        mes_referencia: formatarMesReferencia(mesReferencia),
        dias_mes_anterior: 5,
      });
      setEscalas(data.escalas || []);
      setPeriodo(data.periodo || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setEscalas([]);
        setPeriodo(null);
        setError("empty");
      } else {
        setError("Não foi possível carregar a escala. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }, [mesReferencia]);

  useEffect(() => {
    carregarEscalas();
  }, [carregarEscalas]);

  const escalasPorDia = useMemo(() => agruparPorDia(escalas), [escalas]);

  const siglasGrupamento = useMemo(() => {
    const set = new Set(escalas.map((e) => e.grupamento).filter(Boolean));
    return Array.from(set).sort();
  }, [escalas]);

  const mapaCoresGrupamento = useMemo(() => {
    const mapa = new Map();
    siglasGrupamento.forEach((sigla, idx) => {
      mapa.set(sigla, CORES_GRUPAMENTO[idx % CORES_GRUPAMENTO.length]);
    });
    return mapa;
  }, [siglasGrupamento]);

  const idGrupamentoPorSigla = useMemo(() => {
    const mapa = new Map();
    for (const linha of escalas) {
      if (linha.grupamento && linha.id_grupamento && !mapa.has(linha.grupamento)) {
        mapa.set(linha.grupamento, linha.id_grupamento);
      }
    }
    return mapa;
  }, [escalas]);

  const [membrosPorGrupamento, setMembrosPorGrupamento] = useState(new Map());
  const [carregandoMembros, setCarregandoMembros] = useState(false);

  useEffect(() => {
    if (idGrupamentoPorSigla.size === 0) return;
    let cancelado = false;
    async function carregarEfetivo() {
      setCarregandoMembros(true);
      const entradas = Array.from(idGrupamentoPorSigla.entries());
      const resultados = await Promise.all(
        entradas.map(async ([sigla, id]) => {
          try {
            const { data } = await api.get(`/minha-escala/grupamento/${id}/membros`);
            return [sigla, data || []];
          } catch {
            return [sigla, []];
          }
        }),
      );
      if (!cancelado) {
        setMembrosPorGrupamento(new Map(resultados));
        setCarregandoMembros(false);
      }
    }
    carregarEfetivo();
    return () => {
      cancelado = true;
    };
  }, [idGrupamentoPorSigla]);

  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [substituicoesDoDia, setSubstituicoesDoDia] = useState([]);
  const [carregandoSubstituicoes, setCarregandoSubstituicoes] = useState(false);

  useEffect(() => {
    if (!diaSelecionado) {
      setSubstituicoesDoDia([]);
      return;
    }
    let cancelado = false;
    async function carregar() {
      try {
        setCarregandoSubstituicoes(true);
        const { data } = await api.get(`/minha-escala/substituicao/dia/${diaSelecionado}`);
        if (!cancelado) setSubstituicoesDoDia(data || []);
      } catch {
        if (!cancelado) setSubstituicoesDoDia([]);
      } finally {
        if (!cancelado) setCarregandoSubstituicoes(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [diaSelecionado]);

  const diasDoPeriodo = useMemo(() => {
    if (!periodo) return [];
    const inicio = parseDataLocal(periodo.data_inicio);
    const fim = parseDataLocal(periodo.data_fim);
    const dias = [];
    let cursor = new Date(inicio);
    while (cursor <= fim) {
      dias.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dias;
  }, [periodo]);

  const semanasMobile = useMemo(() => {
    if (!periodo) return [];
    return montarSemanas(periodo.data_inicio, periodo.data_fim);
  }, [periodo]);

  const turnosDoDia = (date) => escalasPorDia.get(chaveISO(date)) || [];

  const irParaMes = (delta) => {
    setMesReferencia((atual) => {
      const proximo = new Date(atual);
      proximo.setMonth(proximo.getMonth() + delta);
      return proximo;
    });
  };

  // Efetivo real do dia (vínculo mensal + substituições pontuais já
  // aplicadas) — mesmo cálculo do PainelDoDia do admin.
  function calcularEfetivoDoDia(linha) {
    const membrosBase = membrosPorGrupamento.get(linha.grupamento) || [];
    const subsDoTurno = substituicoesDoDia.filter(
      (s) => s.turno === linha.turno && s.grupamento === linha.grupamento,
    );
    const idsQueSairam = new Set(
      subsDoTurno.filter((s) => s.id_usuario_sai).map((s) => s.id_usuario_sai),
    );
    const entradas = subsDoTurno
      .filter((s) => s.id_usuario_entra)
      .map((s) => ({ id_user: s.id_usuario_entra, nome: s.nome_usuario_entra, nome_guerra: null }));

    return [...membrosBase.filter((m) => !idsQueSairam.has(m.id_user)), ...entradas];
  }

  const [alvoWizard, setAlvoWizard] = useState(null); // { id_user, nome, nome_guerra }
  const [avisoEnvio, setAvisoEnvio] = useState(null);

  const diaSelecionadoDate = diaSelecionado ? parseDataLocal(diaSelecionado) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              Escala de Serviço
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Clique em um dia para ver o efetivo e solicitar permuta
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
        <div className="px-4 md:px-8 pb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => irParaMes(-1)}
              className="p-1.5 rounded-md hover:bg-white text-slate-500 hover:text-slate-800 transition"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 text-sm font-semibold text-slate-800 font-mono capitalize min-w-[9rem] text-center">
              {nomeDoMes(mesReferencia)}
            </span>
            <button
              onClick={() => irParaMes(1)}
              className="p-1.5 rounded-md hover:bg-white text-slate-500 hover:text-slate-800 transition"
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-emerald-600" />
          </div>
        )}

        {!loading && error && error !== "empty" && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-center gap-3 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {!loading && error === "empty" && (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <ShieldCheck className="text-slate-300" size={40} />
            <p className="text-slate-500 text-sm max-w-sm">
              Nenhuma escala gerada para este período ainda.
            </p>
          </div>
        )}

        {!loading && !error && periodo && (
          <>
            <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
              <table className="min-w-full border-collapse font-mono text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white border-b border-r border-slate-200 px-3 py-2 text-left text-xs text-slate-500 font-semibold uppercase tracking-wide">
                      Turno
                    </th>
                    {diasDoPeriodo.map((dia, idx) => (
                      <th key={idx} className="border-b border-slate-200 px-0.5 py-1.5 text-center min-w-[34px]">
                        <button
                          onClick={() => setDiaSelecionado(chaveISO(dia))}
                          className="w-full flex flex-col items-center gap-0.5 py-1 rounded-md hover:bg-slate-100 transition group"
                        >
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                            {DIAS_SEMANA_CURTO[dia.getDay()]}
                          </span>
                          <span className="text-slate-700 font-bold group-hover:text-emerald-600">
                            {dia.getDate()}
                          </span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((numeroTurno) => (
                    <tr key={numeroTurno} className="odd:bg-slate-50">
                      <td className="sticky left-0 bg-white border-r border-slate-200 px-3 py-2 text-xs text-slate-500 font-semibold whitespace-nowrap">
                        {numeroTurno}º Turno
                      </td>
                      {diasDoPeriodo.map((dia, idx) => {
                        const linha = turnosDoDia(dia).find((l) => l.turno === numeroTurno);
                        const cor = linha ? corDoGrupamento(linha.grupamento, mapaCoresGrupamento) : null;
                        return (
                          <td key={idx} className="border-t border-slate-100 text-center p-0.5">
                            {linha ? (
                              <button
                                onClick={() => setDiaSelecionado(chaveISO(dia))}
                                className={`w-full py-1.5 rounded-md font-bold ${cor.bg} ${cor.text} ring-1 ${cor.ring} hover:brightness-95 transition`}
                                title={`Grupamento ${linha.grupamento} · ${linha.hora_inicio} às ${linha.hora_fim}`}
                              >
                                {linha.grupamento}
                              </button>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-6">
              {semanasMobile.map((semana, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                    {DIAS_SEMANA_CURTO.map((d, i) => (
                      <div key={i} className="text-center text-[10px] font-semibold text-slate-400 py-1.5">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {semana.map((dia, i) => {
                      const linhas = turnosDoDia(dia);
                      const foraDoMes = dia.getMonth() !== mesReferencia.getMonth();
                      return (
                        <button
                          key={i}
                          onClick={() => setDiaSelecionado(chaveISO(dia))}
                          className={`flex flex-col items-center gap-1 py-2.5 border-t border-r border-slate-100 last:border-r-0 transition ${
                            foraDoMes ? "opacity-30" : "hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-xs font-mono font-bold text-slate-700">{dia.getDate()}</span>
                          <div className="flex gap-0.5">
                            {linhas.slice(0, 3).map((l, li) => {
                              const cor = corDoGrupamento(l.grupamento, mapaCoresGrupamento);
                              return <span key={li} className={`size-1.5 rounded-full ${cor.dot}`} />;
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {diaSelecionadoDate && (
        <div className="fixed inset-0 z-40 flex items-end lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDiaSelecionado(null)} />
          <div className="relative w-full lg:max-w-lg bg-white border-t lg:border border-slate-200 rounded-t-2xl lg:rounded-2xl p-5 max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500 font-mono uppercase">
                  {diaSelecionadoDate.toLocaleDateString("pt-BR", { weekday: "long" })}
                </p>
                <h2 className="text-xl font-bold text-slate-800">
                  {diaSelecionadoDate.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
              </div>
              <button
                onClick={() => setDiaSelecionado(null)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {turnosDoDia(diaSelecionadoDate).length === 0 && (
                <p className="text-sm text-slate-400 py-6 text-center">Nenhum turno gerado para este dia.</p>
              )}
              {turnosDoDia(diaSelecionadoDate).map((linha) => {
                const cor = corDoGrupamento(linha.grupamento, mapaCoresGrupamento);
                const efetivo = calcularEfetivoDoDia(linha);
                return (
                  <div key={linha.turno} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="text-xs text-slate-500 font-mono">
                      {linha.turno}º Turno · {linha.hora_inicio} às {linha.hora_fim}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold ${cor.bg} ${cor.text} ring-1 ${cor.ring}`}
                    >
                      <span className={`size-1.5 rounded-full ${cor.dot}`} />
                      Grupamento {linha.grupamento}
                    </span>

                    <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-1.5">
                      {carregandoMembros || carregandoSubstituicoes ? (
                        <p className="text-xs text-slate-400">Carregando efetivo...</p>
                      ) : efetivo.length === 0 ? (
                        <p className="text-xs text-slate-400">Nenhum militar escalado nesse turno.</p>
                      ) : (
                        efetivo.map((m) => {
                          const souEu = Number(m.id_user) === Number(meuId);
                          return (
                            <div
                              key={m.id_user}
                              className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg"
                            >
                              <p className="text-xs font-semibold text-slate-700">
                                {m.nome}
                                {souEu && <span className="ml-1.5 text-emerald-600 font-normal">(você)</span>}
                              </p>
                              {!souEu && (
                                <button
                                  onClick={() =>
                                    setAlvoWizard({
                                      id_user: m.id_user,
                                      nome: m.nome,
                                      nome_guerra: m.nome_guerra,
                                    })
                                  }
                                  className="flex items-center gap-1 px-2 py-1 bg-purple-100 hover:bg-purple-600 hover:text-white text-purple-700 text-[11px] font-semibold rounded transition flex-shrink-0"
                                >
                                  <ArrowLeftRight size={11} />
                                  Permutar com
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {alvoWizard && (
        <WizardPermuta
          alvo={alvoWizard}
          meuId={meuId}
          onFechar={() => setAlvoWizard(null)}
          onEnviado={(protocolo) => {
            setAlvoWizard(null);
            setAvisoEnvio(protocolo);
          }}
        />
      )}

      {avisoEnvio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAvisoEnvio(null)} />
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-center">
            <CheckCircle2 className="mx-auto text-emerald-500 mb-3" size={40} />
            <h3 className="text-base font-bold text-slate-800 mb-1">Solicitação enviada!</h3>
            <p className="text-sm text-slate-500 mb-1">
              Protocolo <span className="font-mono font-bold text-slate-700">{avisoEnvio}</span>
            </p>
            <p className="text-sm text-slate-500 mb-5">
              Aguardando a confirmação do militar alvo. Acompanhe em "Minhas Permutas".
            </p>
            <button
              onClick={() => setAvisoEnvio(null)}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// ASSISTENTE DE PERMUTA — 3 passos
//   1) meu dia/turno disponível (select)
//   2) dia/turno disponível do alvo (select)
//   3) motivo (mín. 5 letras) -> enviar
// ===========================================================================
function WizardPermuta({ alvo, meuId, onFechar, onEnviado }) {
  const [passo, setPasso] = useState(1);

  const [minhaAgenda, setMinhaAgenda] = useState([]);
  const [carregandoMinhaAgenda, setCarregandoMinhaAgenda] = useState(true);
  const [meuDiaEscolhido, setMeuDiaEscolhido] = useState("");

  const [agendaAlvo, setAgendaAlvo] = useState([]);
  const [carregandoAgendaAlvo, setCarregandoAgendaAlvo] = useState(false);
  const [diaAlvoEscolhido, setDiaAlvoEscolhido] = useState("");

  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      try {
        setCarregandoMinhaAgenda(true);
        const { data } = await api.get(`/permutas/agenda/${meuId}`);
        if (!cancelado) setMinhaAgenda(data.agenda || []);
      } catch {
        if (!cancelado) setErro("Não foi possível carregar a sua agenda.");
      } finally {
        if (!cancelado) setCarregandoMinhaAgenda(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [meuId]);

  const carregarAgendaAlvo = async () => {
    try {
      setCarregandoAgendaAlvo(true);
      setErro(null);
      const { data } = await api.get(`/permutas/agenda/${alvo.id_user}`);
      setAgendaAlvo(data.agenda || []);
    } catch {
      setErro("Não foi possível carregar a agenda do militar alvo.");
    } finally {
      setCarregandoAgendaAlvo(false);
    }
  };

  const irParaPasso2 = () => {
    if (!meuDiaEscolhido) return;
    setErro(null);
    setPasso(2);
    carregarAgendaAlvo();
  };

  const irParaPasso3 = () => {
    if (!diaAlvoEscolhido) return;
    setErro(null);
    setPasso(3);
  };

  const motivoValido = motivo.trim().length >= 5;

  const enviar = async () => {
    if (!motivoValido) return;
    const [dataMinha, turnoMinha, grupMinha] = meuDiaEscolhido.split("|");
    const [dataAlvoSel, turnoAlvoSel, grupAlvoSel] = diaAlvoEscolhido.split("|");

    setEnviando(true);
    setErro(null);
    try {
      const { data } = await api.post("/permutas", {
        fk_id_usuario_alvo: alvo.id_user,
        data_solicitante: dataMinha,
        fk_id_turno_solicitante: Number(turnoMinha),
        fk_id_grupamento_solicitante: Number(grupMinha),
        data_alvo: dataAlvoSel,
        fk_id_turno_alvo: Number(turnoAlvoSel),
        fk_id_grupamento_alvo: Number(grupAlvoSel),
        motivo,
      });
      onEnviado(data.protocolo);
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível enviar a solicitação de permuta.");
    } finally {
      setEnviando(false);
    }
  };

  const nomeAlvo = alvo.nome_guerra || alvo.nome;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative w-full lg:max-w-lg bg-white border-t lg:border border-slate-200 rounded-t-2xl lg:rounded-2xl p-5 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-base font-bold text-slate-800 pr-4">Permutar com {nomeAlvo}</h2>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mb-4">
          {[1, 2, 3].map((p) => (
            <span
              key={p}
              className={`h-1.5 flex-1 rounded-full ${p <= passo ? "bg-purple-600" : "bg-slate-200"}`}
            />
          ))}
        </div>

        {erro && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{erro}</div>
        )}

        {passo === 1 && (
          <div>
            <p className="text-sm text-slate-600 mb-3">Passo 1 de 3 — Escolha o seu dia/turno para a permuta.</p>
            {carregandoMinhaAgenda ? (
              <p className="text-sm text-slate-400">Carregando sua agenda...</p>
            ) : minhaAgenda.length === 0 ? (
              <p className="text-sm text-slate-400">Você não tem dias de serviço disponíveis no período.</p>
            ) : (
              <select
                value={meuDiaEscolhido}
                onChange={(e) => setMeuDiaEscolhido(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Selecione um dia...</option>
                {minhaAgenda.map((d) => (
                  <option
                    key={`${d.data}-${d.fk_id_turno}`}
                    value={`${d.data.slice(0, 10)}|${d.fk_id_turno}|${d.fk_id_grupamento}`}
                  >
                    {formatarDataBR(d.data)} · {d.turno}º turno ({d.hora_inicio}–{d.hora_fim}) · Grupamento{" "}
                    {d.grupamento}
                  </option>
                ))}
              </select>
            )}
            <div className="flex justify-end mt-5">
              <button
                onClick={irParaPasso2}
                disabled={!meuDiaEscolhido}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
              >
                Avançar
              </button>
            </div>
          </div>
        )}

        {passo === 2 && (
          <div>
            <p className="text-sm text-slate-600 mb-3">
              Passo 2 de 3 — Escolha o dia/turno de {nomeAlvo} que você quer assumir.
            </p>
            {carregandoAgendaAlvo ? (
              <p className="text-sm text-slate-400">Carregando a agenda de {nomeAlvo}...</p>
            ) : agendaAlvo.length === 0 ? (
              <p className="text-sm text-slate-400">
                {nomeAlvo} não tem dias de serviço disponíveis no período.
              </p>
            ) : (
              <select
                value={diaAlvoEscolhido}
                onChange={(e) => setDiaAlvoEscolhido(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Selecione um dia...</option>
                {agendaAlvo.map((d) => (
                  <option
                    key={`${d.data}-${d.fk_id_turno}`}
                    value={`${d.data.slice(0, 10)}|${d.fk_id_turno}|${d.fk_id_grupamento}`}
                  >
                    {formatarDataBR(d.data)} · {d.turno}º turno ({d.hora_inicio}–{d.hora_fim}) · Grupamento{" "}
                    {d.grupamento}
                  </option>
                ))}
              </select>
            )}
            <div className="flex justify-between mt-5">
              <button
                onClick={() => setPasso(1)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Voltar
              </button>
              <button
                onClick={irParaPasso3}
                disabled={!diaAlvoEscolhido}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
              >
                Avançar
              </button>
            </div>
          </div>
        )}

        {passo === 3 && (
          <div>
            <p className="text-sm text-slate-600 mb-3">Passo 3 de 3 — Explique o motivo da solicitação.</p>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              placeholder="Ex: preciso trocar por motivo de consulta médica..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Mínimo de 5 letras.</p>
            <div className="flex justify-between mt-5">
              <button
                onClick={() => setPasso(2)}
                disabled={enviando}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={enviar}
                disabled={!motivoValido || enviando}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition text-white ${
                  motivoValido
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-slate-300 cursor-not-allowed"
                } disabled:opacity-60`}
              >
                <Send size={15} />
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
