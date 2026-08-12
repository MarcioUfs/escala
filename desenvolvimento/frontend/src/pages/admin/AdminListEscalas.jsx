import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  X,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Radio,
  UserPlus,
  ArrowLeftRight,
  Search,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

// ---------------------------------------------------------------------------
// TOKENS DE DESIGN
// Tema claro (fundo branco/slate-50), consistente com o restante do painel
// administrativo. Azul como cor primária de ação, mono nos dados de grade
// (data, hora, sigla de grupamento) pra reforçar a leitura tipo "painel de
// despacho" sem depender de um fundo escuro pra isso.
// ---------------------------------------------------------------------------
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

// -----------------------------------------------------------------------
// CORREÇÃO DE FUSO HORÁRIO
// `new Date("2026-08-01")` é interpretado pelo navegador como UTC. Em
// fusos negativos (Brasil, UTC-3) isso "puxa" a data um dia pra trás
// (vira 31/07 21h local) — e foi exatamente isso que causava os
// "buracos" na tabela: as colunas do calendário nasciam com a data
// errada, deixavam de bater com a chave usada em `escalasPorDia` (que
// vem direto da string, sem esse parsing), e a partir daí as duas
// listas desalinhavam pro resto do período. A partir daqui, toda data
// vinda do backend passa por esta função, que monta o Date sempre no
// fuso local.
// -----------------------------------------------------------------------
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

// Agrupa a lista plana [{data, turno, grupamento, hora_inicio, hora_fim, id_escala}, ...]
// em um mapa por dia: { "2026-07-01": [ {turno:1,...}, {turno:2,...}, {turno:3,...} ] }
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

// Quebra um intervalo de datas em blocos de 7 dias, começando no domingo da
// semana do primeiro dia, pro calendário mobile ficar alinhado como um
// calendário de verdade (não corta a semana no meio).
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

function chaveISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hojeISO() {
  return chaveISO(new Date());
}

// "26020718549" -> "260.207.185-49" — mesmo padrão usado no documento
// oficial da escala.
function formatarCpf(cpf) {
  if (!cpf || cpf.length !== 11) return cpf || "";
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

export default function DashboardEscala() {
  const navigate = useNavigate();

  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [diasAnteriores] = useState(5); // "os cinco dias anteriores" pedido

  const [escalas, setEscalas] = useState([]);
  const [periodo, setPeriodo] = useState(null); // {data_inicio, data_fim}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [diaSelecionado, setDiaSelecionado] = useState(null); // "yyyy-mm-dd"
  const [turnoEmEdicao, setTurnoEmEdicao] = useState(null); // linha da escala

  const [confirmandoEdicaoMes, setConfirmandoEdicaoMes] = useState(false);
  const [salvandoMes, setSalvandoMes] = useState(false);

  // -------------------------------------------------------------------
  // Carregamento dos dados do período (mês + N dias anteriores)
  // -------------------------------------------------------------------
  const carregarEscalas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post("/escalas/listar/periodo-estendido", {
        mes_referencia: formatarMesReferencia(mesReferencia),
        dias_mes_anterior: diasAnteriores,
      });
      setEscalas(data.escalas || []);
      setPeriodo(data.periodo || null);
    } catch (err) {
      if (err.response?.status === 404) {
        // Período sem nenhuma linha gerada ainda — não é um erro de
        // sistema, é estado vazio (ninguém rodou "gerar" pra esse mês).
        setEscalas([]);
        setPeriodo(null);
        setError("empty");
      } else {
        setError("Não foi possível carregar a escala. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }, [mesReferencia, diasAnteriores]);

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

  // Sigla -> id_grupamento, derivado dos próprios dados da escala (não
  // precisa de endpoint novo pra isso — cada linha já carrega os dois).
  const idGrupamentoPorSigla = useMemo(() => {
    const mapa = new Map();
    for (const linha of escalas) {
      if (linha.grupamento && linha.id_grupamento && !mapa.has(linha.grupamento)) {
        mapa.set(linha.grupamento, linha.id_grupamento);
      }
    }
    return mapa;
  }, [escalas]);

  // Efetivo (militares) de cada grupamento — busca única em lote (só 6
  // grupamentos possíveis, cardinalidade fixa), não uma chamada por
  // célula da tabela. É isso que "popula" cada turno com os componentes.
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
            const { data } = await api.get(`/escalas/grupamento/${id}/membros`);
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

  // Recarrega o efetivo de UM grupamento específico (usado depois de
  // adicionar/remover/trocar, pra não precisar recarregar os 6 de novo)
  const recarregarEfetivoDoGrupamento = useCallback(async (sigla, id) => {
    try {
      const { data } = await api.get(`/escalas/grupamento/${id}/membros`);
      setMembrosPorGrupamento((atual) => {
        const novo = new Map(atual);
        novo.set(sigla, data || []);
        return novo;
      });
    } catch {
      // se falhar, mantém o estado anterior — não derruba a tela por isso
    }
  }, []);

  // Estados dos modais de gestão de efetivo
  const [modalAdicionar, setModalAdicionar] = useState(null); // { sigla, idGrupamento }
  const [modalTrocar, setModalTrocar] = useState(null); // { membro, siglaAtual, idAtual }
  const [modalPermutar, setModalPermutar] = useState(null); // { membro, siglaAtual, idAtual }
  const [acaoEmAndamento, setAcaoEmAndamento] = useState(false);
  const [erroGestaoEfetivo, setErroGestaoEfetivo] = useState(null);

  // Adiciona um militar a um grupamento (vínculo a partir de hoje)
  const adicionarMilitar = async (usuario, sigla, idGrupamento) => {
    setAcaoEmAndamento(true);
    setErroGestaoEfetivo(null);
    try {
      await api.post("/escalas/grupamento-usuario", {
        fk_id_usuario: usuario.id_user || usuario.id,
        fk_id_grupamento: idGrupamento,
        data_inicio: hojeISO(),
      });
      await recarregarEfetivoDoGrupamento(sigla, idGrupamento);
      setModalAdicionar(null);
    } catch (err) {
      setErroGestaoEfetivo(
        err.response?.data?.msg ||
          "Não foi possível adicionar o militar (ele pode já ter vínculo ativo em outro grupamento).",
      );
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  // "Excluir da escala mensal" — encerra o vínculo do militar com o
  // grupamento a partir de hoje (fica de fora dos próximos ciclos gerados)
  const excluirDaEscalaMensal = async (membro, sigla, idGrupamento) => {
    setAcaoEmAndamento(true);
    setErroGestaoEfetivo(null);
    try {
      await api.put(`/escalas/grupamento-usuario/${membro.id_grupamento_usuario}/encerrar`);
      await recarregarEfetivoDoGrupamento(sigla, idGrupamento);
    } catch (err) {
      setErroGestaoEfetivo(
        err.response?.data?.msg || "Não foi possível remover o militar do grupamento.",
      );
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  // Troca o militar de grupamento (encerra o vínculo atual, cria um novo
  // no grupamento de destino a partir de hoje)
  const trocarGrupamento = async (membro, siglaAtual, idAtual, siglaNova, idNovo) => {
    setAcaoEmAndamento(true);
    setErroGestaoEfetivo(null);
    try {
      await api.put(`/escalas/grupamento-usuario/${membro.id_grupamento_usuario}/encerrar`);
      await api.post("/escalas/grupamento-usuario", {
        fk_id_usuario: membro.id_user,
        fk_id_grupamento: idNovo,
        data_inicio: hojeISO(),
      });
      await Promise.all([
        recarregarEfetivoDoGrupamento(siglaAtual, idAtual),
        recarregarEfetivoDoGrupamento(siglaNova, idNovo),
      ]);
      setModalTrocar(null);
    } catch (err) {
      setErroGestaoEfetivo(
        err.response?.data?.msg || "Não foi possível trocar o militar de grupamento.",
      );
    } finally {
      setAcaoEmAndamento(false);
    }
  };

  // Permuta dois militares entre grupamentos diferentes (composição de
  // duas trocas — cada uma encerra o vínculo atual e abre um novo)
  const permutarMilitares = async (membroA, siglaA, idA, membroB, siglaB, idB) => {
    setAcaoEmAndamento(true);
    setErroGestaoEfetivo(null);
    try {
      await api.put(`/escalas/grupamento-usuario/${membroA.id_grupamento_usuario}/encerrar`);
      await api.put(`/escalas/grupamento-usuario/${membroB.id_grupamento_usuario}/encerrar`);
      await api.post("/escalas/grupamento-usuario", {
        fk_id_usuario: membroA.id_user,
        fk_id_grupamento: idB,
        data_inicio: hojeISO(),
      });
      await api.post("/escalas/grupamento-usuario", {
        fk_id_usuario: membroB.id_user,
        fk_id_grupamento: idA,
        data_inicio: hojeISO(),
      });
      await Promise.all([
        recarregarEfetivoDoGrupamento(siglaA, idA),
        recarregarEfetivoDoGrupamento(siglaB, idB),
      ]);
      setModalPermutar(null);
    } catch (err) {
      setErroGestaoEfetivo(
        err.response?.data?.msg || "Não foi possível permutar os militares.",
      );
    } finally {
      setAcaoEmAndamento(false);
    }
  };

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

  // Dias dentro do período que ainda não têm nenhuma linha gerada no banco
  // — usado só pra avisar o admin, nunca pra desenhar dado fictício na tela.
  const diasSemEscala = useMemo(
    () => diasDoPeriodo.filter((d) => !escalasPorDia.has(chaveISO(d))),
    [diasDoPeriodo, escalasPorDia],
  );

  // -------------------------------------------------------------------
  // Navegação de mês
  // -------------------------------------------------------------------
  const irParaMes = (delta) => {
    setMesReferencia((atual) => {
      const proximo = new Date(atual);
      proximo.setMonth(proximo.getMonth() + delta);
      return proximo;
    });
  };

  // -------------------------------------------------------------------
  // Edição mensal — impacto direto no ciclo inteiro do período visível.
  // Diferente do ajuste manual: regenera a escala a partir da regra do
  // ciclo pra todo o intervalo, não só um dia.
  // -------------------------------------------------------------------
  const confirmarEdicaoMensal = async () => {
    if (!periodo) return;
    try {
      setSalvandoMes(true);
      await api.post("/escalas/gerar", {
        data_inicio: periodo.data_inicio,
        data_fim: periodo.data_fim,
      });
      await carregarEscalas();
      setConfirmandoEdicaoMes(false);
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          "Não foi possível regenerar a escala do mês.",
      );
    } finally {
      setSalvandoMes(false);
    }
  };

  const diaSelecionadoDate = diaSelecionado ? parseDataLocal(diaSelecionado) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* CABEÇALHO */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 ring-1 ring-indigo-200 p-2 rounded-lg">
              <Radio className="text-indigo-600 size-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                E-Escala
                <span className="text-slate-400 font-normal text-sm">
                  · Gestão de Efetivo
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                Regime de turnos · Ciclo de rotação
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white text-sm font-medium rounded-lg hover:bg-green-900 transition shadow-sm"
            >
              <ArrowLeft size={16} />
              Voltar a gestão
            </button>
          </div>
        </div>

        {/* Navegação de mês + ação de edição mensal */}
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

          <button
            onClick={() => setConfirmandoEdicaoMes(true)}
            disabled={!periodo || loading}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition shadow-sm"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Editar escala do mês</span>
            <span className="sm:hidden">Editar mês</span>
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-indigo-600" />
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
              Nenhuma escala gerada para este período ainda. Use "Editar
              escala do mês" para gerar os dias a partir do ciclo.
            </p>
          </div>
        )}

        {!loading && !error && periodo && (
          <>
            {/* Aviso de dias sem escala gerada dentro do período visível */}
            {diasSemEscala.length > 0 && (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <span className="text-indigo-800">
                  <strong>{diasSemEscala.length}</strong>{" "}
                  {diasSemEscala.length === 1
                    ? "dia deste período ainda não tem"
                    : "dias deste período ainda não têm"}{" "}
                  escala gerada no banco.
                </span>
                <button
                  onClick={() => setConfirmandoEdicaoMes(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md transition whitespace-nowrap"
                >
                  Gerar agora
                </button>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* DESKTOP — tabela mensal completa (igual ao modelo impresso) */}
            {/* ----------------------------------------------------- */}
            <div className="hidden lg:block">
              <TabelaDesktop
                dias={diasDoPeriodo}
                turnosDoDia={turnosDoDia}
                mapaCoresGrupamento={mapaCoresGrupamento}
                membrosPorGrupamento={membrosPorGrupamento}
                onSelecionarDia={(date) => setDiaSelecionado(chaveISO(date))}
              />
            </div>

            {/* ----------------------------------------------------- */}
            {/* MOBILE / TABLET — calendário quebrado em semanas de 7 dias */}
            {/* ----------------------------------------------------- */}
            <div className="lg:hidden space-y-6">
              {semanasMobile.map((semana, idx) => (
                <CalendarioSemana
                  key={idx}
                  semana={semana}
                  mesReferencia={mesReferencia}
                  turnosDoDia={turnosDoDia}
                  mapaCoresGrupamento={mapaCoresGrupamento}
                  onSelecionarDia={(date) => setDiaSelecionado(chaveISO(date))}
                />
              ))}
            </div>

            {/* Efetivo por grupamento — cards mais largos, ocupando toda a
                largura disponível. Só vira 2 colunas em telas realmente
                grandes (xl); antes disso fica em 1 coluna só, sem
                espremer os botões de ação. */}
            <div className="mt-8">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 text-center">
                Efetivo por Grupamento
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {siglasGrupamento.map((sigla) => (
                  <GrupamentoRosterCard
                    key={sigla}
                    sigla={sigla}
                    idGrupamento={idGrupamentoPorSigla.get(sigla)}
                    cor={corDoGrupamento(sigla, mapaCoresGrupamento)}
                    membros={membrosPorGrupamento.get(sigla) || []}
                    carregando={carregandoMembros}
                    onAdicionar={() =>
                      setModalAdicionar({ sigla, idGrupamento: idGrupamentoPorSigla.get(sigla) })
                    }
                    onExcluirMensal={(membro) =>
                      excluirDaEscalaMensal(membro, sigla, idGrupamentoPorSigla.get(sigla))
                    }
                    onTrocar={(membro) =>
                      setModalTrocar({ membro, siglaAtual: sigla, idAtual: idGrupamentoPorSigla.get(sigla) })
                    }
                    onPermutar={(membro) =>
                      setModalPermutar({ membro, siglaAtual: sigla, idAtual: idGrupamentoPorSigla.get(sigla) })
                    }
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL — adicionar militar ao grupamento */}
      {/* ------------------------------------------------------------- */}
      {modalAdicionar && (
        <ModalBuscaMilitar
          titulo={`Adicionar militar ao Grupamento ${modalAdicionar.sigla}`}
          excluirIds={new Set(
            (membrosPorGrupamento.get(modalAdicionar.sigla) || []).map((m) => m.id_user),
          )}
          confirmando={acaoEmAndamento}
          erro={erroGestaoEfetivo}
          onFechar={() => {
            setModalAdicionar(null);
            setErroGestaoEfetivo(null);
          }}
          onSelecionar={(usuario) =>
            adicionarMilitar(usuario, modalAdicionar.sigla, modalAdicionar.idGrupamento)
          }
          rotuloAcao="Adicionar"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL — trocar militar de grupamento (definitivo, a partir de hoje) */}
      {/* ------------------------------------------------------------- */}
      {modalTrocar && (
        <ModalTrocarGrupamento
          membro={modalTrocar.membro}
          siglaAtual={modalTrocar.siglaAtual}
          grupamentosDisponiveis={siglasGrupamento
            .filter((s) => s !== modalTrocar.siglaAtual)
            .map((s) => ({ sigla: s, id: idGrupamentoPorSigla.get(s) }))}
          confirmando={acaoEmAndamento}
          erro={erroGestaoEfetivo}
          onFechar={() => {
            setModalTrocar(null);
            setErroGestaoEfetivo(null);
          }}
          onConfirmar={(siglaNova, idNovo) =>
            trocarGrupamento(modalTrocar.membro, modalTrocar.siglaAtual, modalTrocar.idAtual, siglaNova, idNovo)
          }
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL — permutar com outro militar (troca cruzada de grupamento) */}
      {/* ------------------------------------------------------------- */}
      {modalPermutar && (
        <ModalBuscaMilitar
          titulo={`Permutar ${modalPermutar.membro.nome_guerra || modalPermutar.membro.nome} com...`}
          excluirIds={new Set([modalPermutar.membro.id_user])}
          confirmando={acaoEmAndamento}
          erro={erroGestaoEfetivo}
          onFechar={() => {
            setModalPermutar(null);
            setErroGestaoEfetivo(null);
          }}
          onSelecionar={(usuario) => {
            // O militar-alvo pode estar em qualquer grupamento — descobre
            // qual, entre os já carregados, pra montar a troca cruzada.
            let siglaB = null;
            let idB = null;
            let membroB = null;
            for (const [sigla, membros] of membrosPorGrupamento.entries()) {
              const encontrado = membros.find((m) => m.id_user === (usuario.id_user || usuario.id));
              if (encontrado) {
                siglaB = sigla;
                idB = idGrupamentoPorSigla.get(sigla);
                membroB = encontrado;
                break;
              }
            }
            if (!membroB) {
              setErroGestaoEfetivo("Esse militar não está vinculado a nenhum grupamento no momento.");
              return;
            }
            permutarMilitares(
              modalPermutar.membro,
              modalPermutar.siglaAtual,
              modalPermutar.idAtual,
              membroB,
              siglaB,
              idB,
            );
          }}
          rotuloAcao="Permutar"
          apenasVinculados
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* PAINEL DO DIA — turnos + grupamento, com edição por turno */}
      {/* ------------------------------------------------------------- */}
      {diaSelecionadoDate && (
        <PainelDoDia
          data={diaSelecionadoDate}
          turnos={turnosDoDia(diaSelecionadoDate)}
          mapaCoresGrupamento={mapaCoresGrupamento}
          membrosPorGrupamento={membrosPorGrupamento}
          carregandoMembros={carregandoMembros}
          idGrupamentoPorSigla={idGrupamentoPorSigla}
          onFechar={() => setDiaSelecionado(null)}
          onEditarTurno={(linha) => setTurnoEmEdicao(linha)}
          onAdicionarMes={(sigla, idGrupamento) => setModalAdicionar({ sigla, idGrupamento })}
          onExcluirMes={(membro, sigla, idGrupamento) => excluirDaEscalaMensal(membro, sigla, idGrupamento)}
          onTrocarMes={(membro, siglaAtual, idAtual) => setModalTrocar({ membro, siglaAtual, idAtual })}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDITOR DE MILITARES DO GRUPAMENTO (por turno selecionado) */}
      {/* ------------------------------------------------------------- */}
      {turnoEmEdicao && (
        <EditorMilitares
          linha={turnoEmEdicao}
          onFechar={() => setTurnoEmEdicao(null)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* CONFIRMAÇÃO — edição mensal (impacto no ciclo inteiro) */}
      {/* ------------------------------------------------------------- */}
      {confirmandoEdicaoMes && (
        <ModalConfirmacao
          titulo="Editar escala do mês"
          descricao="Isso regenera todos os dias do período visível a partir da regra do ciclo. Ajustes manuais feitos em dias específicos dentro desse intervalo serão sobrescritos. Essa ação afeta o mês inteiro, não apenas um dia."
          confirmando={salvandoMes}
          onCancelar={() => setConfirmandoEdicaoMes(false)}
          onConfirmar={confirmarEdicaoMensal}
        />
      )}
    </div>
  );
}

// ===========================================================================
// TABELA DESKTOP
// ===========================================================================
function TabelaDesktop({ dias, turnosDoDia, mapaCoresGrupamento, membrosPorGrupamento, onSelecionarDia }) {
  const turnosLabel = [
    { numero: 1, label: "1º Turno" },
    { numero: 2, label: "2º Turno" },
    { numero: 3, label: "3º Turno" },
  ];

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="min-w-full border-collapse font-mono text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white border-b border-r border-slate-200 px-3 py-2 text-left text-xs text-slate-500 font-semibold uppercase tracking-wide">
              Turno
            </th>
            {dias.map((dia, idx) => (
              <th
                key={idx}
                className="border-b border-slate-200 px-0.5 py-1.5 text-center min-w-[34px]"
              >
                <button
                  onClick={() => onSelecionarDia(dia)}
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
          {turnosLabel.map((t) => (
            <tr key={t.numero} className="odd:bg-slate-50">
              <td className="sticky left-0 bg-white border-r border-slate-200 px-3 py-2 text-xs text-slate-500 font-semibold whitespace-nowrap">
                {t.label}
              </td>
              {dias.map((dia, idx) => {
                const linha = turnosDoDia(dia).find((l) => l.turno === t.numero);
                const cor = linha
                  ? corDoGrupamento(linha.grupamento, mapaCoresGrupamento)
                  : null;
                const membros = linha ? membrosPorGrupamento.get(linha.grupamento) : null;
                const efetivo = membros?.length;
                const nomesTooltip = membros?.length
                  ? membros.map((m) => m.nome).join(", ")
                  : "Nenhum militar vinculado a este grupamento";
                return (
                  <td key={idx} className="border-t border-slate-100 text-center p-0.5">
                    {linha ? (
                      <button
                        onClick={() => onSelecionarDia(dia)}
                        className={`w-full py-1 rounded-md font-bold ${cor.bg} ${cor.text} ring-1 ${cor.ring} hover:brightness-95 transition flex flex-col items-center leading-tight`}
                        title={`Grupamento ${linha.grupamento} · ${linha.hora_inicio} às ${linha.hora_fim}${linha.origem === "AJUSTE_MANUAL" ? " · ajuste manual" : ""} · ${nomesTooltip}`}
                      >
                        <span>
                          {linha.grupamento}
                          {linha.origem === "AJUSTE_MANUAL" && (
                            <span className="ml-0.5 text-[8px] align-top">*</span>
                          )}
                        </span>
                        <span className="text-[9px] font-normal opacity-70">
                          ({efetivo !== undefined ? efetivo : "?"})
                        </span>
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
        * ajuste manual pontual — clique em um dia para ver detalhes
      </p>
    </div>
  );
}

// ===========================================================================
// CALENDÁRIO MOBILE — blocos de 7 dias
// ===========================================================================
function CalendarioSemana({ semana, mesReferencia, turnosDoDia, mapaCoresGrupamento, onSelecionarDia }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {DIAS_SEMANA_CURTO.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-slate-400 py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {semana.map((dia, idx) => {
          const linhas = turnosDoDia(dia);
          const foraDoMes = dia.getMonth() !== mesReferencia.getMonth();
          return (
            <button
              key={idx}
              onClick={() => onSelecionarDia(dia)}
              className={`flex flex-col items-center gap-1 py-2.5 border-t border-r border-slate-100 last:border-r-0 transition ${
                foraDoMes ? "opacity-30" : "hover:bg-slate-50"
              }`}
            >
              <span className="text-xs font-mono font-bold text-slate-700">
                {dia.getDate()}
              </span>
              <div className="flex gap-0.5">
                {linhas.slice(0, 3).map((l, i) => {
                  const cor = corDoGrupamento(l.grupamento, mapaCoresGrupamento);
                  return <span key={i} className={`size-1.5 rounded-full ${cor.dot}`} />;
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// PAINEL LATERAL / BOTTOM SHEET — detalhe do dia
// ===========================================================================
function PainelDoDia({
  data,
  turnos,
  mapaCoresGrupamento,
  membrosPorGrupamento,
  carregandoMembros,
  idGrupamentoPorSigla,
  onFechar,
  onEditarTurno,
  onAdicionarMes,
  onExcluirMes,
  onTrocarMes,
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />
      <div className="relative w-full lg:max-w-lg bg-white border-t lg:border border-slate-200 rounded-t-2xl lg:rounded-2xl p-5 max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 font-mono uppercase">
              {data.toLocaleDateString("pt-BR", { weekday: "long" })}
            </p>
            <h2 className="text-xl font-bold text-slate-800">
              {data.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {turnos.length === 0 && (
            <p className="text-sm text-slate-400 py-6 text-center">
              Nenhum turno gerado para este dia.
            </p>
          )}
          {turnos.map((linha) => {
            const cor = corDoGrupamento(linha.grupamento, mapaCoresGrupamento);
            const membros = membrosPorGrupamento.get(linha.grupamento) || [];
            const idGrupamento = idGrupamentoPorSigla.get(linha.grupamento);
            return (
              <div
                key={linha.turno}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-mono">
                      {linha.turno}º Turno · {linha.hora_inicio} às {linha.hora_fim}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold ${cor.bg} ${cor.text} ring-1 ${cor.ring}`}
                    >
                      <span className={`size-1.5 rounded-full ${cor.dot}`} />
                      Grupamento {linha.grupamento}
                    </span>
                    {linha.observacao && linha.observacao !== "Sem observação" && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        {linha.observacao}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onEditarTurno(linha)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-md transition"
                  >
                    <Pencil size={13} />
                    Editar
                  </button>
                </div>

                {/* Ações de adicionar — nível do turno (não precisam de um
                    militar já selecionado) */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => onAdicionarMes(linha.grupamento, idGrupamento)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition"
                  >
                    <UserPlus size={13} />
                    Adicionar (mês inteiro)
                  </button>
                  <button
                    disabled
                    title="Depende de uma tabela de substituição pontual por dia, ainda não implementada no backend"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded-md cursor-not-allowed"
                  >
                    <Lock size={13} />
                    Adicionar (só hoje)
                  </button>
                </div>

                {/* Componentes (militares) do grupamento, cada um com suas
                    próprias ações — sempre visíveis, sem menu suspenso
                    (evita o bug de recorte dentro de área com scroll) */}
                <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-2">
                  {carregandoMembros ? (
                    <p className="text-xs text-slate-400">Carregando efetivo...</p>
                  ) : membros.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Nenhum militar vinculado a este grupamento ainda.
                    </p>
                  ) : (
                    membros.map((m) => (
                      <div
                        key={m.id_user}
                        className="p-2 bg-white border border-slate-200 rounded-lg"
                      >
                        <p className="text-xs font-semibold text-slate-700 mb-1.5">{m.nome}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => onExcluirMes(m, linha.grupamento, idGrupamento)}
                            title="Excluir da escala mensal"
                            className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-[11px] font-semibold rounded transition"
                          >
                            <Trash2 size={11} />
                            Excluir (mês)
                          </button>
                          <button
                            disabled
                            title="Depende de uma tabela de substituição pontual por dia, ainda não implementada no backend"
                            className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-300 text-[11px] font-semibold rounded cursor-not-allowed"
                          >
                            <Lock size={11} />
                            Excluir (dia)
                          </button>
                          <button
                            onClick={() => onTrocarMes(m, linha.grupamento, idGrupamento)}
                            title="Trocar de grupamento (mês inteiro)"
                            className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 text-[11px] font-semibold rounded transition"
                          >
                            <ArrowLeftRight size={11} />
                            Permutar (mês)
                          </button>
                          <button
                            disabled
                            title="Depende de uma tabela de substituição pontual por dia, ainda não implementada no backend"
                            className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-300 text-[11px] font-semibold rounded cursor-not-allowed"
                          >
                            <Lock size={11} />
                            Permutar (dia)
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// CARD DE EFETIVO DE UM GRUPAMENTO
// Lista os militares no formato de credencial do documento oficial
// (patente + matrícula + nome + CPF), com menu de ações por militar.
// ===========================================================================
function GrupamentoRosterCard({
  sigla,
  idGrupamento,
  cor,
  membros,
  carregando,
  onAdicionar,
  onExcluirMensal,
  onTrocar,
  onPermutar,
}) {
  const confirmarExclusao = (membro) => {
    const nome = membro.nome_guerra || membro.nome;
    if (window.confirm(`Remover ${nome} do Grupamento ${sigla}? Isso encerra o vínculo dele com este grupamento.`)) {
      onExcluirMensal(membro);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-visible">
      <div className={`flex items-center justify-between px-4 py-3 ${cor.bg} ring-1 ${cor.ring}`}>
        <span className={`inline-flex items-center gap-1.5 text-sm font-mono font-bold ${cor.text}`}>
          <span className={`size-2 rounded-full ${cor.dot}`} />
          Grupamento {sigla}
          <span className="opacity-70">· {membros.length}</span>
        </span>
        <button
          onClick={onAdicionar}
          disabled={!idGrupamento}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <UserPlus size={13} />
          Adicionar
        </button>
      </div>

      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {carregando && <p className="px-4 py-3 text-xs text-slate-400">Carregando...</p>}
        {!carregando && membros.length === 0 && (
          <p className="px-4 py-3 text-xs text-slate-400">Nenhum militar vinculado.</p>
        )}
        {membros.map((m) => (
          <div key={m.id_user} className="px-4 py-3">
            <p className="text-base font-bold text-slate-900 leading-snug">
              {(m.nome_guerra || m.nome || "").toUpperCase()}
            </p>
            <p className="text-sm text-slate-600 font-mono mt-0.5 mb-2">
              {m.sigla_patente || "—"} · Mat. {m.matricula} · CPF {formatarCpf(m.cpf)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onTrocar(m)}
                title="Trocar de grupamento (definitivo)"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 text-xs font-semibold rounded transition"
              >
                <ArrowLeftRight size={13} />
                Trocar
              </button>
              <button
                onClick={() => onPermutar(m)}
                title="Permutar com outro militar"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-600 text-xs font-semibold rounded transition"
              >
                <ArrowLeftRight size={13} />
                Permutar
              </button>
              <button
                onClick={() => confirmarExclusao(m)}
                title="Excluir da escala mensal"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-xs font-semibold rounded transition"
              >
                <Trash2 size={13} />
                Excluir
              </button>
              <button
                disabled
                title="Depende de uma tabela de substituição pontual por dia, ainda não implementada no backend"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded cursor-not-allowed"
              >
                <Lock size={13} />
                Excluir (dia)
              </button>
              <button
                disabled
                title="Depende de uma tabela de substituição pontual por dia, ainda não implementada no backend"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-400 text-xs font-semibold rounded cursor-not-allowed"
              >
                <Lock size={13} />
                Permutar (dia)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// MODAL DE BUSCA DE MILITAR
// Reutilizado tanto pra "adicionar militar ao grupamento" quanto pra
// "permutar com outro militar". Busca por nome, CPF, matrícula, e-mail,
// telefone ou nome de guerra — filtro em memória sobre /admin/allusers
// (lista pequena o bastante pra isso ser instantâneo).
// ===========================================================================
function ModalBuscaMilitar({ titulo, excluirIds, confirmando, erro, onFechar, onSelecionar, rotuloAcao }) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState(null);

  useEffect(() => {
    async function carregarBase() {
      try {
        const { data } = await api.get("/admin/allusers");
        setTodosUsuarios(Array.isArray(data) ? data : []);
      } catch {
        setTodosUsuarios([]);
      }
    }
    carregarBase();
  }, []);

  useEffect(() => {
    if (!todosUsuarios) return;
    const termo = busca.trim().toLowerCase();
    if (termo.length < 2) {
      setResultados([]);
      return;
    }
    const filtrados = todosUsuarios.filter((u) => {
      if (excluirIds?.has(u.id)) return false;
      const campos = [u.nome, u.cpf, u.matricula, u.email, u.telefone, u.nome_guerra]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      return campos.some((c) => c.includes(termo));
    });
    setResultados(filtrados.slice(0, 8));
  }, [busca, todosUsuarios, excluirIds]);

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative w-full lg:max-w-lg bg-white border-t lg:border border-slate-200 rounded-t-2xl lg:rounded-2xl p-5 max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 pr-4">{titulo}</h2>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {erro && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{erro}</div>
        )}

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, CPF, matrícula, e-mail, telefone ou nome de guerra..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="mt-3 space-y-1.5">
          {busca.trim().length >= 2 && resultados.length === 0 && (
            <p className="text-xs text-slate-400 py-3 text-center">Nenhum militar encontrado.</p>
          )}
          {resultados.map((u) => (
            <button
              key={u.id}
              disabled={confirmando}
              onClick={() => onSelecionar(u)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition text-left disabled:opacity-50"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-700 truncate">{u.nome}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {u.patente_sigla ? `${u.patente_sigla} · ` : ""}
                  {u.matricula} · {formatarCpf(u.cpf)}
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 flex-shrink-0">{rotuloAcao}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// MODAL — trocar militar de grupamento (definitivo, a partir de hoje)
// ===========================================================================
function ModalTrocarGrupamento({ membro, siglaAtual, grupamentosDisponiveis, confirmando, erro, onFechar, onConfirmar }) {
  const [alvo, setAlvo] = useState(null); // { sigla, id }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-slate-800 mb-1">Trocar de grupamento</h3>
        <p className="text-sm text-slate-500 mb-4">
          {membro.nome_guerra || membro.nome} sai do Grupamento {siglaAtual} e passa a integrar o
          grupamento escolhido a partir de hoje.
        </p>

        {erro && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{erro}</div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-5">
          {grupamentosDisponiveis.map((g) => (
            <button
              key={g.sigla}
              onClick={() => setAlvo(g)}
              className={`py-2 rounded-lg text-sm font-mono font-bold border transition ${
                alvo?.sigla === g.sigla
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
              }`}
            >
              {g.sigla}
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onFechar}
            disabled={confirmando}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => alvo && onConfirmar(alvo.sigla, alvo.id)}
            disabled={!alvo || confirmando}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
          >
            {confirmando ? "Aplicando..." : "Confirmar troca"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// EDITOR DE MILITARES DE UM TURNO/GRUPAMENTO
//
// Depende de GET /escalas/grupamento/:id/membros (já implementado no
// backend). A adição usa POST /escalas/grupamento-usuario (também já
// existe), mas isso vincula o militar ao grupamento por período — não é
// uma troca pontual só daquele dia. Permuta pontual (substituição só
// naquele plantão) é um módulo separado, planejado pra próxima etapa.
// ===========================================================================
function EditorMilitares({ linha, onFechar }) {
  const [membros, setMembros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [endpointIndisponivel, setEndpointIndisponivel] = useState(false);
  const [busca, setBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const { data } = await api.get(
          `/escalas/grupamento/${linha.id_grupamento || linha.grupamento}/membros`,
        );
        setMembros(data || []);
      } catch (err) {
        setEndpointIndisponivel(true);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [linha]);

  const buscarMilitares = async (termo) => {
    setBusca(termo);
    if (termo.trim().length < 2) {
      setResultadosBusca([]);
      return;
    }
    try {
      const { data } = await api.get("/admin/allusers");
      const lista = Array.isArray(data) ? data : [];
      const termoLower = termo.toLowerCase();
      setResultadosBusca(
        lista
          .filter(
            (u) =>
              u.nome?.toLowerCase().includes(termoLower) ||
              u.matricula?.includes(termo),
          )
          .slice(0, 6),
      );
    } catch {
      setResultadosBusca([]);
    }
  };

  const adicionarMilitar = async (usuario) => {
    // Checagem local best-effort da regra "não escalar duas vezes no mesmo
    // dia+turno". A validação definitiva vem do backend (409 quando o
    // militar já tem vínculo ativo em outro grupamento).
    const jaEscalado = membros.some((m) => m.id_user === usuario.id);
    if (jaEscalado) {
      setErro("Este militar já está escalado neste grupamento/turno.");
      return;
    }

    try {
      setErro(null);
      await api.post("/escalas/grupamento-usuario", {
        fk_id_usuario: usuario.id,
        fk_id_grupamento: linha.id_grupamento || linha.grupamento,
        data_inicio: linha.data,
      });
      setMembros((atual) => [...atual, { id_user: usuario.id, nome: usuario.nome }]);
      setBusca("");
      setResultadosBusca([]);
    } catch (err) {
      setErro(
        err.response?.data?.msg ||
          "Não foi possível vincular o militar (verifique se ele já possui vínculo ativo em outro grupamento).",
      );
    }
  };

  const removerMilitar = async (membro) => {
    try {
      setErro(null);
      await api.put(`/escalas/grupamento-usuario/${membro.id_grupamento_usuario}/encerrar`);
      setMembros((atual) => atual.filter((m) => m.id_user !== membro.id_user));
    } catch {
      setErro("Não foi possível remover o militar.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative w-full lg:max-w-lg bg-white border-t lg:border border-slate-200 rounded-t-2xl lg:rounded-2xl p-5 max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 font-mono">
              {linha.turno}º Turno · Grupamento {linha.grupamento}
            </p>
            <h2 className="text-lg font-bold text-slate-800">
              Militares escalados
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {endpointIndisponivel && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex gap-2">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              Não foi possível carregar a lista de militares deste
              grupamento agora. A busca e o vínculo abaixo continuam
              funcionando normalmente.
            </span>
          </div>
        )}

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {erro}
          </div>
        )}

        {/* Lista atual */}
        <div className="space-y-2 mb-5">
          {carregando && (
            <p className="text-sm text-slate-400 py-4 text-center">Carregando...</p>
          )}
          {!carregando && membros.length === 0 && !endpointIndisponivel && (
            <p className="text-sm text-slate-400 py-4 text-center">
              Nenhum militar escalado ainda.
            </p>
          )}
          {membros.map((m) => (
            <div
              key={m.id_user}
              className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <span className="text-sm text-slate-700">{m.nome}</span>
              <button
                onClick={() => removerMilitar(m)}
                className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                aria-label={`Remover ${m.nome}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Busca e adição */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Adicionar militar
          </label>
          <input
            type="text"
            value={busca}
            onChange={(e) => buscarMilitares(e.target.value)}
            placeholder="Buscar por nome ou matrícula..."
            className="mt-1.5 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {resultadosBusca.length > 0 && (
            <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {resultadosBusca.map((u) => (
                <button
                  key={u.id}
                  onClick={() => adicionarMilitar(u)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-50 transition text-left"
                >
                  <span className="text-sm text-slate-700">{u.nome}</span>
                  <Plus size={14} className="text-indigo-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// MODAL DE CONFIRMAÇÃO GENÉRICO
// ===========================================================================
function ModalConfirmacao({ titulo, descricao, confirmando, onCancelar, onConfirmar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancelar} />
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-slate-800 mb-2">{titulo}</h3>
        <p className="text-sm text-slate-500 mb-5">{descricao}</p>
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
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
          >
            {confirmando ? "Aplicando..." : "Confirmar edição"}
          </button>
        </div>
      </div>
    </div>
  );
}