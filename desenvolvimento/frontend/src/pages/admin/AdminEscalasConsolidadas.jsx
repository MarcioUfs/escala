import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Radio,
  Printer,
  X,
  AlertTriangle,
  Calendar,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  ArrowLeftRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

// ---------------------------------------------------------------------------
// "Escalas Consolidadas" — lista os meses que já têm escala gerada e mostra,
// pra cada um, a grade completa (calendário no mesmo formato desktop de
// /admin/escala) com o efetivo NOMINAL final de cada turno já somando
// escala normal + adições + permutas − folgas, mais o log de ajustes
// pontuais do dia e a restrição/motivo de afastamento de cada militar
// naquele dia específico. É uma tela de CONSULTA/histórico — sem os botões
// de editar (adicionar/trocar/permutar) que existem na escala ao vivo.
//
// Não existe uma tabela de "snapshot mensal" separada: v2_escala, as
// substituições pontuais e os afastamentos já ficam salvos por data pra
// sempre, então "salvar o mês automaticamente" já acontece como
// consequência natural do funcionamento normal do sistema — esta tela só
// lista, a partir do que já existe, quais meses têm dado disponível.
// ---------------------------------------------------------------------------

// Mesma paleta/lógica de cor por grupamento da tela /admin/escala, pra o
// calendário aqui ficar visualmente idêntico.
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

// "2026-09-05" -> Date(2026, 8, 5) local, sem deslocamento de fuso.
function parseDataLocal(dataISO) {
  const [ano, mes, dia] = dataISO.slice(0, 10).split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function chaveISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// "200200000098" -> "2002000000-98"
function formatarMatricula(matricula) {
  if (!matricula) return "";
  const digitos = String(matricula).replace(/\D/g, "");
  if (digitos.length < 3) return String(matricula);
  return `${digitos.slice(0, -2)}-${digitos.slice(-2)}`;
}

// "09/2026" -> "Setembro de 2026"
function labelDoMes(mesReferencia) {
  const [mes, ano] = mesReferencia.split("/");
  const data = new Date(Number(ano), Number(mes) - 1, 1);
  const nome = data.toLocaleDateString("pt-BR", { month: "long" });
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

function formatarCabecalhoDia(dataISO) {
  const data = parseDataLocal(dataISO);
  const dia = String(data.getDate()).padStart(2, "0");
  const nomeMes = data.toLocaleDateString("pt-BR", { month: "long" });
  const diaSemana = data.toLocaleDateString("pt-BR", { weekday: "long" });
  return `${dia} de ${nomeMes} de ${data.getFullYear()} (${diaSemana})`;
}

function nomeMilitar(m) {
  const patente = m.sigla_patente ? `${m.sigla_patente} ` : "";
  return `${patente}${formatarMatricula(m.matricula)} ${(m.nome_guerra || m.nome || "").toUpperCase()}`;
}

const BADGE_ORIGEM = {
  ADICAO: { label: "Adicionado", cls: "bg-emerald-100 text-emerald-700" },
  PERMUTA: { label: "Permuta", cls: "bg-purple-100 text-purple-700" },
};

export default function AdminEscalasConsolidadas() {
  const navigate = useNavigate();

  const [meses, setMeses] = useState([]);
  const [carregandoMeses, setCarregandoMeses] = useState(true);
  const [erro, setErro] = useState(null);

  const [mesSelecionado, setMesSelecionado] = useState(null); // "MM/YYYY"
  const [dadosMes, setDadosMes] = useState(null);
  const [carregandoMes, setCarregandoMes] = useState(false);

  const [diaSelecionado, setDiaSelecionado] = useState(null); // "YYYY-MM-DD"

  useEffect(() => {
    (async () => {
      try {
        setCarregandoMeses(true);
        setErro(null);
        const { data } = await api.get("/escalas/consolidadas/meses");
        setMeses(data || []);
      } catch (err) {
        setErro(err.response?.data?.msg || "Não foi possível carregar a lista de meses.");
      } finally {
        setCarregandoMeses(false);
      }
    })();
  }, []);

  const abrirMes = useCallback(async (mesReferencia) => {
    setMesSelecionado(mesReferencia);
    setDadosMes(null);
    setDiaSelecionado(null);
    setErro(null);
    setCarregandoMes(true);
    try {
      const { data } = await api.post("/escalas/consolidadas/mes", { mes_referencia: mesReferencia });
      setDadosMes(data);
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível carregar a escala consolidada desse mês.");
    } finally {
      setCarregandoMes(false);
    }
  }, []);

  const voltarParaLista = () => {
    setMesSelecionado(null);
    setDadosMes(null);
    setDiaSelecionado(null);
    setErro(null);
  };

  const diasPorData = useMemo(() => {
    const mapa = new Map();
    (dadosMes?.dias || []).forEach((d) => mapa.set(d.data, d.turnos));
    return mapa;
  }, [dadosMes]);

  const diasDoMes = useMemo(() => {
    if (!dadosMes) return [];
    const inicio = parseDataLocal(dadosMes.periodo.data_inicio);
    const fim = parseDataLocal(dadosMes.periodo.data_fim);
    const arr = [];
    const cursor = new Date(inicio);
    while (cursor <= fim) {
      arr.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return arr;
  }, [dadosMes]);

  const siglasGrupamento = useMemo(() => {
    const set = new Set();
    (dadosMes?.dias || []).forEach((d) => d.turnos.forEach((t) => set.add(t.grupamento)));
    return Array.from(set).sort();
  }, [dadosMes]);

  const mapaCoresGrupamento = useMemo(() => {
    const mapa = new Map();
    siglasGrupamento.forEach((sigla, idx) => mapa.set(sigla, CORES_GRUPAMENTO[idx % CORES_GRUPAMENTO.length]));
    return mapa;
  }, [siglasGrupamento]);

  function turnosDoDia(date) {
    return diasPorData.get(chaveISO(date)) || [];
  }

  const turnosDoDiaSelecionado = diaSelecionado ? diasPorData.get(diaSelecionado) || [] : [];

  function imprimir() {
    const tituloAntes = document.title;
    if (mesSelecionado) {
      document.title = `Escala consolidada ${labelDoMes(mesSelecionado)} ${Date.now()}`;
    }
    window.print();
    document.title = tituloAntes;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm print:hidden">
        <div className="px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              Escalas Consolidadas
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Histórico mensal — escala normal + ajustes pontuais + restrições, por dia e turno
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
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white text-sm font-medium rounded-lg hover:bg-green-900 transition shadow-sm"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 print:hidden">
        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2 max-w-4xl mx-auto">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            {erro}
          </div>
        )}

        {/* ================= LISTA DE MESES ================= */}
        {!mesSelecionado && (
          <div className="max-w-3xl mx-auto">
            {carregandoMeses ? (
              <p className="text-sm text-slate-400 text-center py-10">Carregando meses...</p>
            ) : meses.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">
                Nenhuma escala gerada ainda — os meses aparecem aqui assim que a escala é criada em
                "Gestão de Efetivo".
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {meses.map((m) => (
                  <button
                    key={m.mes_referencia}
                    onClick={() => abrirMes(m.mes_referencia)}
                    className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:border-indigo-300 hover:shadow-md transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar size={16} className="text-indigo-500" />
                      <span className="font-semibold text-sm text-slate-800">
                        {labelDoMes(m.mes_referencia)}
                      </span>
                    </span>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= DETALHE DO MÊS ================= */}
        {mesSelecionado && (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={voltarParaLista}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
              >
                <ChevronLeft size={16} />
                Meses
              </button>
              <span className="px-3 text-sm font-semibold text-slate-800 font-mono capitalize">
                {labelDoMes(mesSelecionado)}
              </span>
              {dadosMes && (
                <button
                  onClick={imprimir}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition"
                >
                  <Printer size={15} />
                  Imprimir / Gerar PDF
                </button>
              )}
            </div>

            {carregandoMes && <p className="text-sm text-slate-400 text-center py-10">Carregando...</p>}

            {dadosMes && (
              <>
                {/* -------- DESKTOP — mesmo formato de /admin/escala -------- */}
                <div className="hidden lg:block max-w-6xl mx-auto">
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                    <table className="min-w-full border-collapse font-mono text-sm">
                      <thead>
                        <tr>
                          <th className="sticky left-0 bg-white border-b border-r border-slate-200 px-3 py-2 text-left text-xs text-slate-500 font-semibold uppercase tracking-wide">
                            Turno
                          </th>
                          {diasDoMes.map((dia, idx) => (
                            <th
                              key={idx}
                              className="border-b border-slate-200 px-0.5 py-1.5 text-center min-w-[34px]"
                            >
                              <button
                                onClick={() => setDiaSelecionado(chaveISO(dia))}
                                className="w-full flex flex-col items-center gap-0.5 py-1 rounded-md hover:bg-slate-100 transition group"
                              >
                                <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                                  {DIAS_SEMANA_CURTO[dia.getDay()]}
                                </span>
                                <span className="text-slate-700 font-bold group-hover:text-indigo-600">
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
                            {diasDoMes.map((dia, idx) => {
                              const linha = turnosDoDia(dia).find((l) => l.turno === numeroTurno);
                              const cor = linha ? corDoGrupamento(linha.grupamento, mapaCoresGrupamento) : null;
                              const efetivo = linha?.membros.length;
                              const temAjuste = linha?.ajustes.length > 0;
                              const temRestricao = linha?.membros.some((m) => m.restricoes.length > 0);
                              const tooltip = linha
                                ? `Grupamento ${linha.grupamento} · ${linha.hora_inicio} às ${linha.hora_fim} · ${
                                    linha.membros.map((m) => nomeMilitar(m)).join(", ") || "sem efetivo"
                                  }`
                                : "";
                              return (
                                <td key={idx} className="border-t border-slate-100 text-center p-0.5">
                                  {linha ? (
                                    <button
                                      onClick={() => setDiaSelecionado(chaveISO(dia))}
                                      className={`w-full py-1 rounded-md font-bold ${cor.bg} ${cor.text} ring-1 ${cor.ring} hover:brightness-95 transition flex flex-col items-center leading-tight`}
                                      title={tooltip}
                                    >
                                      <span>
                                        {linha.grupamento}
                                        {temAjuste && (
                                          <span className="ml-0.5 text-[11px] font-bold align-top">*</span>
                                        )}
                                        {temRestricao && (
                                          <span className="ml-0.5 text-[11px] font-bold align-top text-amber-700">!</span>
                                        )}
                                      </span>
                                      <span className="text-[9px] font-normal opacity-70">({efetivo})</span>
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
                    <p className="px-3 py-2 text-[11px] text-slate-400 border-t border-slate-200">
                      <span className="font-bold">*</span> houve ajuste pontual (adição/permuta/folga) nesse turno ·{" "}
                      <span className="font-bold text-amber-700">!</span> alguém do efetivo tinha restrição/afastamento
                      ativo · clique em um dia pra ver o detalhamento
                    </p>
                  </div>
                </div>

                <p className="lg:hidden text-sm text-slate-500 text-center py-10 max-w-sm mx-auto">
                  Esta tela foi desenhada pro formato desktop (mesmo layout de "Gestão de Efetivo").
                  Abra numa tela maior pra ver o calendário do mês.
                </p>
              </>
            )}
          </div>
        )}
      </main>

      {/* ================= PAINEL DO DIA (somente consulta) ================= */}
      {diaSelecionado && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 print:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDiaSelecionado(null)} />
          <div className="relative w-full lg:max-w-2xl bg-white border border-slate-200 rounded-2xl p-5 max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 capitalize">
                {formatarCabecalhoDia(diaSelecionado)}
              </h2>
              <button
                onClick={() => setDiaSelecionado(null)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {turnosDoDiaSelecionado.length === 0 && (
                <p className="text-sm text-slate-400 py-6 text-center">Nenhum turno gerado para este dia.</p>
              )}
              {turnosDoDiaSelecionado.map((linha) => {
                const cor = corDoGrupamento(linha.grupamento, mapaCoresGrupamento);
                const folgas = linha.ajustes.filter((a) => a.sai && (a.tipo === "EXCLUSAO" || a.tipo === "PERMUTA"));
                return (
                  <div key={linha.turno} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 font-mono">
                        {linha.turno}º Turno · {linha.hora_inicio} às {linha.hora_fim}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-bold ${cor.bg} ${cor.text} ring-1 ${cor.ring}`}
                      >
                        <span className={`size-1.5 rounded-full ${cor.dot}`} />
                        Grupamento {linha.grupamento}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {linha.membros.length === 0 && (
                        <p className="text-xs text-slate-400">Nenhum militar escalado.</p>
                      )}
                      {linha.membros.map((m) => {
                        const badge = BADGE_ORIGEM[m.origem];
                        return (
                          <div key={m.id_user} className="p-2 bg-white border border-slate-200 rounded-lg">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-xs font-semibold text-slate-700">{nomeMilitar(m)}</p>
                              {badge && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              )}
                            </div>
                            {m.restricoes.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {m.restricoes.map((r, i) => (
                                  <span
                                    key={i}
                                    title={r.mensagem}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold cursor-help"
                                  >
                                    <AlertTriangle size={10} />
                                    {r.mensagem}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {folgas.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/70">
                        <p className="text-[11px] font-semibold text-slate-500 mb-1">Saíram do turno:</p>
                        <div className="space-y-1">
                          {folgas.map((a) => (
                            <p key={a.id_substituicao} className="text-[11px] text-rose-700 flex items-center gap-1">
                              {a.tipo === "PERMUTA" ? (
                                <ArrowLeftRight size={11} />
                              ) : (
                                <RefreshCw size={11} />
                              )}
                              {nomeMilitar(a.sai)} — {a.tipo === "PERMUTA" ? "permutou" : "folga"}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VERSÃO IMPRIMÍVEL — mesmo conteúdo do mês, */}
      {/* já expandido dia a dia (sem precisar clicar em nada) ================= */}
      {dadosMes && (
        <div className="hidden print:block px-8 py-6">
          <h1 className="text-lg font-bold text-center uppercase mb-1">
            Escala Consolidada — {labelDoMes(mesSelecionado)}
          </h1>
          <p className="text-xs text-center text-slate-500 mb-6">
            Escala normal + ajustes pontuais (adição/permuta/folga) + restrição de afastamento por
            militar
          </p>
          <div className="space-y-3 text-[11px]">
            {dadosMes.dias.map((dia) => (
              <div key={dia.data} className="border border-slate-800" style={{ breakInside: "avoid" }}>
                <div className="bg-slate-200 text-center font-bold py-1 border-b border-slate-800 uppercase text-xs">
                  {formatarCabecalhoDia(dia.data)}
                </div>
                {dia.turnos.map((linha) => {
                  const folgas = linha.ajustes.filter((a) => a.sai);
                  return (
                    <div key={linha.turno} className="px-2 py-1.5 border-t border-slate-300">
                      <p className="font-bold">
                        {linha.turno}º TURNO — Grupamento {linha.grupamento}
                      </p>
                      <p>
                        {linha.membros.length === 0
                          ? "— sem militares escalados —"
                          : linha.membros
                              .map((m) => {
                                const marca = m.origem === "ADICAO" ? " (adicionado)" : m.origem === "PERMUTA" ? " (permuta)" : "";
                                const restr = m.restricoes.length > 0 ? ` [${m.restricoes.map((r) => r.mensagem).join("; ")}]` : "";
                                return `${nomeMilitar(m)}${marca}${restr}`;
                              })
                              .join(", ")}
                      </p>
                      {folgas.length > 0 && (
                        <p className="text-rose-700">
                          Saíram: {folgas.map((a) => `${nomeMilitar(a.sai)} (${a.tipo === "PERMUTA" ? "permuta" : "folga"})`).join(", ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
