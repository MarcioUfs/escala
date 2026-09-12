import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ShieldCheck,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
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
  ClipboardList,
  FileText,
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

// Categorias fixas do módulo de Afastamentos (mesma lista do backend/
// AdminAfastamentos) — usadas só pra rotular e colorir os quadros abaixo
// do efetivo por grupamento. Gerenciar continua na tela dedicada.
const TIPOS_AFASTAMENTO = [
  { valor: "FERIAS", rotulo: "Férias regulamentares", cor: "amber" },
  { valor: "FERIAS_LEI_109", rotulo: "Férias/LE — Lei 109", cor: "amber" },
  { valor: "LICENCA_ESPECIAL", rotulo: "Licença especial", cor: "sky" },
  { valor: "CURSO", rotulo: "Curso", cor: "indigo" },
  { valor: "RESTRICAO_GERAL", rotulo: "Restrição geral", cor: "slate" },
  { valor: "RESTRICAO_NOTURNA", rotulo: "Restrição noturna", cor: "purple" },
  { valor: "ESCALA_DIFERENCIADA", rotulo: "Escala diferenciada", cor: "rose" },
  { valor: "REDUCAO_CARGA", rotulo: "Redução de carga horária", cor: "teal" },
  { valor: "AFASTAMENTO", rotulo: "Afastamento", cor: "orange" },
];

const CORES_TIPO_AFASTAMENTO = {
  amber: { bg: "bg-amber-50", text: "text-amber-800", ring: "ring-amber-200" },
  sky: { bg: "bg-sky-50", text: "text-sky-800", ring: "ring-sky-200" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-800", ring: "ring-indigo-200" },
  slate: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-800", ring: "ring-purple-200" },
  rose: { bg: "bg-rose-50", text: "text-rose-800", ring: "ring-rose-200" },
  teal: { bg: "bg-teal-50", text: "text-teal-800", ring: "ring-teal-200" },
  orange: { bg: "bg-orange-50", text: "text-orange-800", ring: "ring-orange-200" },
};

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

// "200200000098" -> "2002000000-98" — mesmo padrão usado no documento
// oficial da escala. Normaliza pra dígitos puros antes de formatar (em
// vez de só cortar os 2 últimos caracteres) porque as duas fontes que
// alimentam essa função devolvem formatos diferentes: /escalas/grupamento
// manda a matrícula crua, /admin/allusers já manda formatada com traço —
// sem normalizar primeiro, reformatar a segunda duplicava o traço
// ("2002000000--98").
function formatarMatricula(matricula) {
  if (!matricula) return matricula || "";
  const digitos = String(matricula).replace(/\D/g, "");
  if (digitos.length < 3) return String(matricula);
  return `${digitos.slice(0, -2)}-${digitos.slice(-2)}`;
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

  // Substituições pontuais do dia aberto no modal — buscadas sempre que o
  // dia muda, pra calcular o efetivo real daquele dia (vínculo mensal +
  // desvios pontuais registrados só pra essa data).
  const [substituicoesDoDia, setSubstituicoesDoDia] = useState([]);
  const [carregandoSubstituicoes, setCarregandoSubstituicoes] = useState(false);

  const carregarSubstituicoesDoDia = useCallback(async (diaISO) => {
    try {
      setCarregandoSubstituicoes(true);
      const { data } = await api.get(`/escalas/substituicao/dia/${diaISO}`);
      setSubstituicoesDoDia(data || []);
    } catch {
      setSubstituicoesDoDia([]);
    } finally {
      setCarregandoSubstituicoes(false);
    }
  }, []);

  useEffect(() => {
    if (diaSelecionado) {
      carregarSubstituicoesDoDia(diaSelecionado);
    } else {
      setSubstituicoesDoDia([]);
    }
  }, [diaSelecionado, carregarSubstituicoesDoDia]);

  // Reverte uma substituição pontual (apaga a exceção e recarrega a
  // lista do dia aberto)
  const reverterSubstituicao = async (idSubstituicao) => {
    setSubstituicaoEmAndamento(true);
    setErroSubstituicaoDia(null);
    try {
      await api.delete(`/escalas/substituicao/${idSubstituicao}`);
      if (diaSelecionado) await carregarSubstituicoesDoDia(diaSelecionado);
    } catch (err) {
      setErroSubstituicaoDia(
        err.response?.data?.msg || "Não foi possível reverter essa substituição.",
      );
    } finally {
      setSubstituicaoEmAndamento(false);
    }
  };

  const [confirmandoEdicaoMes, setConfirmandoEdicaoMes] = useState(false);
  const [salvandoMes, setSalvandoMes] = useState(false);

  // Período vazio detectado no 404 (o backend calcula e devolve
  // data_inicio/data_fim mesmo sem nenhuma linha) — usado só pra oferecer
  // a geração automática abaixo, sem duplicar a conta de dias no front.
  const [periodoParaGerar, setPeriodoParaGerar] = useState(null);
  // true assim que a única tentativa automática pro período atual termina
  // (com sucesso ou não) — controla se mostra "gerando..." ou o aviso de
  // fallback com o botão manual.
  const [autoGeracaoConcluida, setAutoGeracaoConcluida] = useState(false);
  // Garante 1 tentativa automática por período (chave data_inicio+data_fim),
  // mesmo que o efeito rode de novo por outro motivo — evita loop se a
  // geração "funcionar" mas continuar vazia (ex: nenhuma regra de ciclo
  // cadastrada ainda).
  const tentativaAutoGeracaoRef = useRef(null);

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
      setPeriodoParaGerar(null);
    } catch (err) {
      if (err.response?.status === 404) {
        // Período sem nenhuma linha gerada ainda — não é um erro de
        // sistema, é estado vazio (ninguém rodou "gerar" pra esse mês).
        setEscalas([]);
        setPeriodo(null);
        setError("empty");
        const periodoDevolvido = err.response?.data?.periodo || null;
        // Novo período vazio (chave diferente da última tentativa) ->
        // reseta o "já tentei" pra permitir a geração automática dele.
        const chave = periodoDevolvido
          ? `${periodoDevolvido.data_inicio}_${periodoDevolvido.data_fim}`
          : null;
        if (chave && tentativaAutoGeracaoRef.current !== chave) {
          setAutoGeracaoConcluida(false);
        }
        setPeriodoParaGerar(periodoDevolvido);
      } else {
        setError("Não foi possível carregar a escala. Tente novamente.");
        setPeriodoParaGerar(null);
      }
    } finally {
      setLoading(false);
    }
  }, [mesReferencia, diasAnteriores]);

  useEffect(() => {
    carregarEscalas();
  }, [carregarEscalas]);

  // -------------------------------------------------------------------
  // Geração automática — só dispara quando o mês está completamente
  // vazio. Mês já populado nunca é auto-regenerado (evita sobrescrever
  // ajustes manuais em silêncio); pra esse caso o admin continua usando
  // o botão "Editar escala do mês" com a confirmação normal.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (error !== "empty" || !periodoParaGerar) return;

    const chave = `${periodoParaGerar.data_inicio}_${periodoParaGerar.data_fim}`;
    if (tentativaAutoGeracaoRef.current === chave) return;
    tentativaAutoGeracaoRef.current = chave;

    let cancelado = false;
    (async () => {
      try {
        await api.post("/escalas/gerar", {
          data_inicio: periodoParaGerar.data_inicio,
          data_fim: periodoParaGerar.data_fim,
        });
        if (!cancelado) await carregarEscalas();
      } catch (err) {
        if (!cancelado) {
          setError(
            err.response?.data?.msg || "Não foi possível gerar a escala automaticamente.",
          );
        }
      } finally {
        if (!cancelado) setAutoGeracaoConcluida(true);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [error, periodoParaGerar, carregarEscalas]);

  // -------------------------------------------------------------------
  // Preenchimento automático de lacunas — diferente da geração do mês
  // vazio acima: aqui o período já tem alguma escala, só faltam alguns
  // dias pontuais (normalmente a borda do período estendido). Chamar
  // /escalas/gerar de novo é seguro mesmo com o mês já populado — a
  // função no banco usa "ON CONFLICT (data, turno) DO NOTHING", ou seja,
  // só insere o que está faltando; nunca sobrescreve um dia que já
  // existe (nem os do ciclo, nem ajustes manuais). Por isso, ao contrário
  // do botão "Editar escala do mês" (que regenera o período inteiro e por
  // isso pede confirmação), preencher só as lacunas não precisa perguntar
  // nada ao administrador.
  const [preenchendoLacunas, setPreenchendoLacunas] = useState(false);
  const [tentouPreencherLacunas, setTentouPreencherLacunas] = useState(false);
  const chaveLacunasRef = useRef(null);

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

  // Efetivo agrupado por categoria de afastamento (férias, licença, curso,
  // restrições, escala diferenciada...) — fotografia de hoje, mesma lógica
  // do resumo do efetivo. Carregado uma vez; não depende do mês navegado
  // na tabela (é sobre a situação atual dos militares, não sobre o
  // calendário sendo visualizado).
  const [afastamentosPorTipo, setAfastamentosPorTipo] = useState({});
  const [carregandoAfastamentos, setCarregandoAfastamentos] = useState(true);

  const carregarAfastamentosAtivos = useCallback(async () => {
    try {
      setCarregandoAfastamentos(true);
      const hoje = new Date().toISOString().slice(0, 10);
      const { data } = await api.get("/afastamentos", { params: { vigente_em: hoje } });
      const agrupado = {};
      (data || []).forEach((a) => {
        if (!agrupado[a.tipo]) agrupado[a.tipo] = [];
        agrupado[a.tipo].push(a);
      });
      setAfastamentosPorTipo(agrupado);
    } catch {
      setAfastamentosPorTipo({});
    } finally {
      setCarregandoAfastamentos(false);
    }
  }, []);

  useEffect(() => {
    carregarAfastamentosAtivos();
  }, [carregarAfastamentosAtivos]);

  // Só as categorias em que o militar CONTINUA disponível pra escala (com
  // alguma condição) entram como sugestão no painel do dia. Férias,
  // licença, curso e afastamento significam "ausente" — esses nunca
  // aparecem aqui, mesmo sendo informativos nos quadros acima.
  const afastamentosDisponiveisParaEscala = useMemo(() => {
    const tiposDisponiveis = ["RESTRICAO_GERAL", "RESTRICAO_NOTURNA", "ESCALA_DIFERENCIADA", "REDUCAO_CARGA"];
    return tiposDisponiveis.flatMap((tipo) => afastamentosPorTipo[tipo] || []);
  }, [afastamentosPorTipo]);

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

  // Estados dos modais de substituição pontual (só um dia, não mexe no
  // vínculo mensal)
  const [modalAdicionarDia, setModalAdicionarDia] = useState(null); // { diaISO, linha }
  const [modalPermutarDia, setModalPermutarDia] = useState(null); // { diaISO, linha, membro }
  const [substituicaoEmAndamento, setSubstituicaoEmAndamento] = useState(false);
  const [erroSubstituicaoDia, setErroSubstituicaoDia] = useState(null);
  // Avisos de restrição/afastamento (módulo é informativo — nunca bloqueia
  // a ação, só alerta depois que ela já foi concluída).
  const [avisosRestricao, setAvisosRestricao] = useState([]);

  // Adiciona um militar à escala só naquele dia+turno — não mexe no
  // vínculo mensal (v2_grupamento_usuario) de ninguém.
  // Nota: fk_id_turno usa linha.turno (o número 1/2/3) porque, na sua
  // seed, id_turno foi criado igual ao número (só existem 3 turnos fixos,
  // sempre os mesmos). Se algum dia isso deixar de ser verdade, precisa
  // de um mapa numero->id_turno igual ao que já existe pra grupamento.
  const substituirAdicaoDia = async (usuario, diaISO, linha) => {
    setSubstituicaoEmAndamento(true);
    setErroSubstituicaoDia(null);
    try {
      const { data } = await api.post("/escalas/substituicao/adicionar", {
        data: diaISO,
        fk_id_turno: linha.turno,
        fk_id_grupamento: linha.id_grupamento,
        fk_id_usuario_entra: usuario.id_user || usuario.id,
      });
      setAvisosRestricao(data?.avisos || []);
      await carregarSubstituicoesDoDia(diaISO);
      setModalAdicionarDia(null);
    } catch (err) {
      setErroSubstituicaoDia(
        err.response?.data?.msg || "Não foi possível adicionar o militar só nesse dia.",
      );
    } finally {
      setSubstituicaoEmAndamento(false);
    }
  };

  // Exclui um militar da escala só naquele dia+turno
  const substituirExclusaoDia = async (membro, diaISO, linha) => {
    const nome = membro.nome_guerra || membro.nome;
    if (
      !window.confirm(
        `Excluir ${nome} da escala só no dia ${diaISO}? O vínculo mensal dele não é afetado.`,
      )
    ) {
      return;
    }
    setSubstituicaoEmAndamento(true);
    setErroSubstituicaoDia(null);
    try {
      await api.post("/escalas/substituicao/excluir", {
        data: diaISO,
        fk_id_turno: linha.turno,
        fk_id_grupamento: linha.id_grupamento,
        fk_id_usuario_sai: membro.id_user,
      });
      await carregarSubstituicoesDoDia(diaISO);
    } catch (err) {
      setErroSubstituicaoDia(
        err.response?.data?.msg || "Não foi possível excluir o militar só nesse dia.",
      );
    } finally {
      setSubstituicaoEmAndamento(false);
    }
  };

  // Permuta dois militares só naquele dia+turno — quem sai é o militar já
  // escalado (clicou em "Permutar (dia)" na linha dele); quem entra é
  // escolhido no modal de busca.
  const substituirPermutaDia = async (usuarioEntra, diaISO, linha, membroSai) => {
    setSubstituicaoEmAndamento(true);
    setErroSubstituicaoDia(null);
    try {
      const { data } = await api.post("/escalas/substituicao/permutar", {
        data: diaISO,
        fk_id_turno: linha.turno,
        fk_id_grupamento: linha.id_grupamento,
        fk_id_usuario_sai: membroSai.id_user,
        fk_id_usuario_entra: usuarioEntra.id_user || usuarioEntra.id,
      });
      setAvisosRestricao(data?.avisos || []);
      await carregarSubstituicoesDoDia(diaISO);
      setModalPermutarDia(null);
    } catch (err) {
      setErroSubstituicaoDia(
        err.response?.data?.msg || "Não foi possível permutar só nesse dia.",
      );
    } finally {
      setSubstituicaoEmAndamento(false);
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

  useEffect(() => {
    if (!periodo || loading || diasSemEscala.length === 0) return;

    const chave = `${periodo.data_inicio}_${periodo.data_fim}`;
    if (chaveLacunasRef.current === chave) return; // já tentou preencher esse período
    chaveLacunasRef.current = chave;
    setTentouPreencherLacunas(false);

    let cancelado = false;
    (async () => {
      setPreenchendoLacunas(true);
      try {
        await api.post("/escalas/gerar", {
          data_inicio: periodo.data_inicio,
          data_fim: periodo.data_fim,
        });
        if (!cancelado) await carregarEscalas();
      } catch {
        // Silencioso — se não der certo (ex: falta regra de ciclo pra
        // algum dia), o aviso com o botão manual serve de fallback.
      } finally {
        if (!cancelado) {
          setPreenchendoLacunas(false);
          setTentouPreencherLacunas(true);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [periodo, diasSemEscala.length, loading, carregarEscalas]);

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
              onClick={() => navigate("/admin/afastamentos")}
              className="flex items-center gap-2 px-4 py-2 bg-orange-700 text-white text-sm font-medium rounded-lg hover:bg-orange-800 transition shadow-sm"
            >
              <ClipboardList size={16} />
              <span className="hidden sm:inline">Afastamentos</span>
            </button>
            <button
              onClick={() => navigate("/admin/boletim-efetivo")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">Boletim</span>
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white text-sm font-medium rounded-lg hover:bg-green-900 transition shadow-sm"
            >
              <ArrowLeft size={16} />
              Voltar a gestão
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6">
        {/* Navegação de mês + ação de edição mensal — fica logo acima da
            própria escala (tabela/calendário), não mais solta no
            cabeçalho, pra ficar visualmente junto do que ela controla.
            Centralizado: o mês/ano é o elemento âncora, o botão de
            renovar escala fica ao lado dele, não nas pontas. */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
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

        {avisosRestricao.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded text-sm text-amber-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">
                    Ação concluída, mas atenção — restrição ativa encontrada:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {avisosRestricao.map((a, i) => (
                      <li key={i}>{a.mensagem}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setAvisosRestricao([])}
                className="text-amber-600 hover:text-amber-900 flex-shrink-0"
                aria-label="Fechar aviso"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

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

        {!loading && error === "empty" && !autoGeracaoConcluida && (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-600" />
            <p className="text-slate-500 text-sm max-w-sm">
              Gerando a escala deste período automaticamente...
            </p>
          </div>
        )}

        {!loading && error === "empty" && autoGeracaoConcluida && (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <ShieldCheck className="text-slate-300" size={40} />
            <p className="text-slate-500 text-sm max-w-sm">
              Não foi possível gerar a escala automaticamente para este período. Use "Editar
              escala do mês" para tentar novamente.
            </p>
          </div>
        )}

        {!loading && !error && periodo && (
          <>
            {/* Dias sem escala dentro do período visível são preenchidos
                automaticamente (sem ação do administrador). Só existe
                indicação visual enquanto isso está em andamento — não há
                botão em nenhuma circunstância; se sobrar alguma lacuna
                genuína (ex: falta regra de ciclo pro dia), o administrador
                ainda tem o "Editar escala do mês" centralizado acima. */}
            {(preenchendoLacunas || (diasSemEscala.length > 0 && !tentouPreencherLacunas)) && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-2 text-sm text-indigo-800">
                <span className="size-3.5 rounded-full border-2 border-indigo-300 border-t-indigo-700 animate-spin" />
                Completando a escala deste período automaticamente...
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

            {/* Efetivo por categoria de afastamento — férias, licença,
                curso, restrições e escala diferenciada. Mesmo padrão visual
                dos quadros de grupamento acima, só que somático (não é
                sobre "onde" o militar está, é sobre a situação dele hoje) e
                sem ações diretas — gerenciar continua na tela dedicada. */}
            <div className="mt-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide text-center">
                  Efetivo por Categoria de Afastamento
                </h2>
                <button
                  onClick={() => navigate("/admin/afastamentos")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
                >
                  <ClipboardList size={13} />
                  Gerenciar
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {TIPOS_AFASTAMENTO.map((t) => (
                  <AfastamentoCategoriaCard
                    key={t.valor}
                    titulo={t.rotulo}
                    cor={t.cor}
                    itens={afastamentosPorTipo[t.valor] || []}
                    carregando={carregandoAfastamentos}
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
          desabilitarLotados
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
      {/* MODAL — adicionar militar só naquele dia (substituição pontual) */}
      {/* ------------------------------------------------------------- */}
      {modalAdicionarDia && (
        <ModalBuscaMilitar
          titulo={`Adicionar militar só no dia ${modalAdicionarDia.diaISO}`}
          excluirIds={
            new Set(
              (membrosPorGrupamento.get(modalAdicionarDia.linha.grupamento) || []).map(
                (m) => m.id_user,
              ),
            )
          }
          confirmando={substituicaoEmAndamento}
          erro={erroSubstituicaoDia}
          onFechar={() => {
            setModalAdicionarDia(null);
            setErroSubstituicaoDia(null);
          }}
          onSelecionar={(usuario) =>
            substituirAdicaoDia(usuario, modalAdicionarDia.diaISO, modalAdicionarDia.linha)
          }
          rotuloAcao="Adicionar"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL — permutar militar só naquele dia (substituição pontual) */}
      {/* ------------------------------------------------------------- */}
      {modalPermutarDia && (
        <ModalBuscaMilitar
          titulo={`Permutar ${modalPermutarDia.membro.nome_guerra || modalPermutarDia.membro.nome} só no dia ${modalPermutarDia.diaISO}`}
          excluirIds={new Set([modalPermutarDia.membro.id_user])}
          confirmando={substituicaoEmAndamento}
          erro={erroSubstituicaoDia}
          onFechar={() => {
            setModalPermutarDia(null);
            setErroSubstituicaoDia(null);
          }}
          onSelecionar={(usuario) =>
            substituirPermutaDia(
              usuario,
              modalPermutarDia.diaISO,
              modalPermutarDia.linha,
              modalPermutarDia.membro,
            )
          }
          rotuloAcao="Permutar"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* PAINEL DO DIA — só ações diárias (efetivo real do dia, com */}
      {/* ajustes pontuais já refletidos). Ações mensais moraram pro */}
      {/* card "Efetivo por Grupamento", mais abaixo na tela. */}
      {/* ------------------------------------------------------------- */}
      {diaSelecionadoDate && (
        <PainelDoDia
          data={diaSelecionadoDate}
          turnos={turnosDoDia(diaSelecionadoDate)}
          mapaCoresGrupamento={mapaCoresGrupamento}
          membrosPorGrupamento={membrosPorGrupamento}
          substituicoesDoDia={substituicoesDoDia}
          afastamentosDisponiveis={afastamentosDisponiveisParaEscala}
          carregandoMembros={carregandoMembros || carregandoSubstituicoes}
          onFechar={() => setDiaSelecionado(null)}
          onAdicionarDia={(diaISO, linha) => setModalAdicionarDia({ diaISO, linha })}
          onAdicionarRapido={(afastamento, diaISO, linha) =>
            substituirAdicaoDia({ id_user: afastamento.fk_id_usuario }, diaISO, linha)
          }
          onExcluirDia={(membro, diaISO, linha) => substituirExclusaoDia(membro, diaISO, linha)}
          onPermutarDia={(membro, diaISO, linha) => setModalPermutarDia({ diaISO, linha, membro })}
          onReverterSubstituicao={(idSubstituicao) => reverterSubstituicao(idSubstituicao)}
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
  substituicoesDoDia,
  afastamentosDisponiveis = [],
  carregandoMembros,
  onFechar,
  onAdicionarDia,
  onAdicionarRapido,
  onExcluirDia,
  onPermutarDia,
  onReverterSubstituicao,
}) {
  const diaISO = chaveISO(data);

  // Dos militares em afastamento/restrição ainda disponíveis pra escala
  // (nunca inclui férias/licença/curso/afastamento — esses estão ausentes),
  // filtra quem é compatível com ESTE turno+grupamento específico: se a
  // restrição lista equipe(s), só entra se este grupamento estiver na
  // lista; se lista turno(s), respeita o modo (SOMENTE só permite os
  // listados, EXCETO permite todos menos os listados).
  function candidatosParaLinha(linha, idsJaNoEfetivo) {
    return afastamentosDisponiveis.filter((a) => {
      if (idsJaNoEfetivo.has(a.fk_id_usuario)) return false;
      if (a.grupamentos?.length > 0 && !a.grupamentos.some((g) => g.sigla === linha.grupamento)) {
        return false;
      }
      if (a.turnos?.length > 0) {
        const turnoNaLista = a.turnos.some((t) => t.numero === linha.turno);
        if (a.modo_restricao === "SOMENTE" && !turnoNaLista) return false;
        if (a.modo_restricao === "EXCETO" && turnoNaLista) return false;
      }
      return true;
    });
  }

  // Mescla o vínculo mensal (membrosPorGrupamento) com as substituições
  // pontuais desse dia, pra mostrar o efetivo REAL de hoje, não o
  // efetivo "padrão" do mês.
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
      .map((s) => ({
        id_user: s.id_usuario_entra,
        nome: s.nome_usuario_entra,
        _idSubstituicao: s.id_substituicao,
        _tipo: s.tipo,
      }));

    const ausencias = subsDoTurno.filter((s) => s.id_usuario_sai);

    const efetivo = [
      ...membrosBase.filter((m) => !idsQueSairam.has(m.id_user)),
      ...entradas,
    ];

    return { efetivo, ausencias };
  }

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
            const { efetivo, ausencias } = calcularEfetivoDoDia(linha);
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
                    onClick={() => onAdicionarDia(diaISO, linha)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition"
                  >
                    <UserPlus size={13} />
                    Adicionar
                  </button>
                </div>

                {/* Efetivo real do dia — vínculo mensal já ajustado pelas
                    substituições pontuais registradas pra essa data */}
                <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-2">
                  {carregandoMembros ? (
                    <p className="text-xs text-slate-400">Carregando efetivo...</p>
                  ) : efetivo.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Nenhum militar escalado nesse dia.
                    </p>
                  ) : (
                    efetivo.map((m) => (
                      <div
                        key={m.id_user}
                        className="p-2 bg-white border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold text-slate-700">{m.nome}</p>
                          {m._idSubstituicao && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold whitespace-nowrap">
                              {m._tipo === "PERMUTA" ? "permuta de hoje" : "extra de hoje"}
                            </span>
                          )}
                        </div>
                        {m.afastamentos_ativos?.length > 0 && (
                          <div className="mb-1.5 flex flex-wrap gap-1">
                            {m.afastamentos_ativos.map((a) => (
                              <span
                                key={a.id_afastamento}
                                title={a.mensagem}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold cursor-help"
                              >
                                <AlertTriangle size={10} />
                                {a.rotulo}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {m._idSubstituicao ? (
                            // Veio de um ajuste pontual (adição ou lado
                            // "entra" de uma permuta) — só dá pra reverter,
                            // não faz sentido "excluir (dia)" de novo.
                            <button
                              onClick={() => onReverterSubstituicao(m._idSubstituicao)}
                              title="Desfazer esse ajuste pontual"
                              className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-700 hover:text-white text-slate-600 text-[11px] font-semibold rounded transition"
                            >
                              <RefreshCw size={11} />
                              Reverter
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => onExcluirDia(m, diaISO, linha)}
                                title="Excluir da escala só nesse dia"
                                className="flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-600 hover:text-white text-red-700 text-[11px] font-semibold rounded transition"
                              >
                                <Trash2 size={11} />
                                Excluir
                              </button>
                              <button
                                onClick={() => onPermutarDia(m, diaISO, linha)}
                                title="Permutar com outro militar só nesse dia"
                                className="flex items-center gap-1 px-2 py-1 bg-purple-100 hover:bg-purple-600 hover:text-white text-purple-700 text-[11px] font-semibold rounded transition"
                              >
                                <ArrowLeftRight size={11} />
                                Permutar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Ausências do dia — quem foi excluído ou saiu numa
                    permuta pontual, com opção de reverter */}
                {ausencias.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/70">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Ausente hoje
                    </p>
                    <div className="space-y-1.5">
                      {ausencias.map((s) => (
                        <div
                          key={s.id_substituicao}
                          className="flex items-center justify-between gap-2 px-2 py-1.5 bg-slate-100/60 rounded-lg"
                        >
                          <span className="text-xs text-slate-500">
                            {s.nome_usuario_sai}
                            <span className="ml-1.5 text-[10px] text-slate-400">
                              ({s.tipo === "PERMUTA" ? "permuta" : "exclusão"})
                            </span>
                          </span>
                          <button
                            onClick={() => onReverterSubstituicao(s.id_substituicao)}
                            className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-700 hover:text-white border border-slate-200 text-slate-600 text-[11px] font-semibold rounded transition"
                          >
                            <RefreshCw size={11} />
                            Reverter
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Militares em afastamento/restrição que ainda podem ser
                    escalados aqui (compatíveis com este turno+equipe) —
                    nunca inclui quem está de férias/licença/curso/
                    afastamento, esses estão ausentes de verdade. Puramente
                    uma sugestão pra agilizar; a inclusão em si passa pela
                    mesma rota de sempre, então continua 100% reversível. */}
                {(() => {
                  const idsJaNoEfetivo = new Set(efetivo.map((m) => m.id_user));
                  const candidatos = candidatosParaLinha(linha, idsJaNoEfetivo);
                  if (candidatos.length === 0) return null;
                  return (
                    <div className="mt-3 pt-3 border-t border-slate-200/70">
                      <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mb-1.5">
                        Disponíveis com restrição
                      </p>
                      <div className="space-y-1.5">
                        {candidatos.map((a) => (
                          <div
                            key={a.id_afastamento}
                            className="flex items-center justify-between gap-2 px-2 py-1.5 bg-amber-50/60 border border-amber-100 rounded-lg"
                          >
                            <span className="text-xs text-slate-700 min-w-0 truncate">
                              {(a.nome_guerra || a.nome || "").toUpperCase()}
                              <span
                                title={a.observacao || ""}
                                className="ml-1.5 text-[10px] text-amber-700 font-semibold"
                              >
                                (
                                {a.turnos?.length > 0
                                  ? `${a.modo_restricao === "SOMENTE" ? "só" : "exceto"} ${a.turnos
                                      .map((t) => `${t.numero}º`)
                                      .join("/")}`
                                  : "restrição"}
                                )
                              </span>
                            </span>
                            <button
                              onClick={() => onAdicionarRapido(a, diaISO, linha)}
                              title="Adicionar esse militar a este turno, só neste dia"
                              className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded transition flex-shrink-0"
                            >
                              <UserPlus size={11} />
                              Adicionar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
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
function formatarDataBRCurta(dataISO) {
  if (!dataISO) return null;
  const [ano, mes, dia] = String(dataISO).slice(0, 10).split("-");
  return `${dia}/${mes}`;
}

// ===========================================================================
// QUADRO DE EFETIVO POR CATEGORIA DE AFASTAMENTO
// Mesmo padrão visual do GrupamentoRosterCard (cabeçalho colorido + lista),
// mas somático e sem ações — gerenciar (criar/editar/encerrar) continua na
// tela dedicada de Afastamentos, alcançável pelo link "Gerenciar" acima.
// ===========================================================================
function AfastamentoCategoriaCard({ titulo, cor, itens, carregando }) {
  const paleta = CORES_TIPO_AFASTAMENTO[cor] || CORES_TIPO_AFASTAMENTO.slate;

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className={`flex items-center justify-between px-4 py-3 ${paleta.bg} ring-1 ${paleta.ring}`}>
        <span className={`text-sm font-bold ${paleta.text}`}>{titulo}</span>
        <span className={`text-xs font-mono font-semibold ${paleta.text} opacity-70`}>
          {itens.length}
        </span>
      </div>
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {carregando && <p className="px-4 py-3 text-xs text-slate-400">Carregando...</p>}
        {!carregando && itens.length === 0 && (
          <p className="px-4 py-3 text-xs text-slate-400">Ninguém nessa categoria hoje.</p>
        )}
        {itens.map((a) => (
          <div key={a.id_afastamento} className="px-4 py-2.5">
            <p className="text-sm font-semibold text-slate-800">
              {(a.nome_guerra || a.nome || "").toUpperCase()}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {a.sigla_patente ? `${a.sigla_patente} · ` : ""}Mat. {formatarMatricula(a.matricula)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              até {a.data_fim ? formatarDataBRCurta(a.data_fim) : "indeterminado"}
              {a.turnos?.length > 0 &&
                ` · ${a.modo_restricao === "SOMENTE" ? "somente" : "exceto"} ${a.turnos
                  .map((t) => `${t.numero}º`)
                  .join("/")} turno`}
              {a.grupamentos?.length > 0 && ` · Eq. ${a.grupamentos.map((g) => g.sigla).join(",")}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

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
            <p className="leading-snug mb-2">
              <span className="text-base font-bold text-slate-900">
                {(m.nome_guerra || m.nome || "").toUpperCase()}
              </span>
              <span className="text-sm text-slate-600 font-mono">
                {" "}
                {m.sigla_patente || "—"} · Mat. {formatarMatricula(m.matricula)} · CPF{" "}
                {formatarCpf(m.cpf)}
              </span>
              {m.afastamentos_ativos?.length > 0 && (
                <span
                  title={m.afastamentos_ativos.map((a) => a.mensagem).join("\n")}
                  className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold align-middle cursor-help"
                >
                  <AlertTriangle size={11} />
                  {m.afastamentos_ativos.length > 1
                    ? `${m.afastamentos_ativos.length} restrições`
                    : m.afastamentos_ativos[0].rotulo}
                </span>
              )}
            </p>
            {/* Grade sempre abaixo do texto (nunca ao lado — era isso que
                causava a distorção). Colunas se ajustam sozinhas: cabe
                quantos botões couberem numa linha (mín. 100px cada); em
                telas largas os 3 ficam numa linha só, e só quebra quando
                não há espaço — sem precisar de regra por breakpoint, e
                novos botões (4º, 5º...) só preenchem a grade. */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-1.5">
              <button
                onClick={() => onTrocar(m)}
                title="Trocar de grupamento (definitivo)"
                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 text-xs font-semibold rounded transition"
              >
                <ArrowLeftRight size={13} />
                Trocar
              </button>
              <button
                onClick={() => onPermutar(m)}
                title="Permutar com outro militar"
                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-600 text-xs font-semibold rounded transition"
              >
                <ArrowLeftRight size={13} />
                Permutar
              </button>
              <button
                onClick={() => confirmarExclusao(m)}
                title="Excluir da escala mensal"
                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-xs font-semibold rounded transition"
              >
                <Trash2 size={13} />
                Excluir
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
function ModalBuscaMilitar({
  titulo,
  excluirIds,
  confirmando,
  erro,
  onFechar,
  onSelecionar,
  rotuloAcao,
  desabilitarLotados = false,
}) {
  const [busca, setBusca] = useState("");
  const [todosUsuarios, setTodosUsuarios] = useState(null);
  const [pagina, setPagina] = useState(1);

  const TAMANHO_PAGINA = 50;

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

  // Base: todos os militares (menos os já excluídos), filtrados pelo termo
  // de busca quando houver um — sem termo, mostra o quadro completo.
  // Disponíveis (sem grupamento_atual) vêm primeiro; lotados ficam no fim.
  const listaFiltrada = useMemo(() => {
    if (!todosUsuarios) return [];
    const termo = busca.trim().toLowerCase();
    const base = todosUsuarios.filter((u) => {
      if (excluirIds?.has(u.id)) return false;
      if (!termo) return true;
      const campos = [u.nome, u.cpf, u.matricula, u.email, u.telefone, u.nome_guerra]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      return campos.some((c) => c.includes(termo));
    });
    return [...base].sort((a, b) => {
      const lotadoDiff = Boolean(a.grupamento_atual) - Boolean(b.grupamento_atual);
      if (lotadoDiff !== 0) return lotadoDiff;
      return (a.nome || "").localeCompare(b.nome || "", "pt-BR", { sensitivity: "base" });
    });
  }, [busca, todosUsuarios, excluirIds]);

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / TAMANHO_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const resultados = listaFiltrada.slice(
    (paginaAtual - 1) * TAMANHO_PAGINA,
    paginaAtual * TAMANHO_PAGINA,
  );

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
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder="Nome, CPF, matrícula, e-mail, telefone ou nome de guerra..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="mt-3 space-y-1.5">
          {todosUsuarios === null && (
            <p className="text-xs text-slate-400 py-3 text-center">Carregando militares...</p>
          )}
          {todosUsuarios !== null && resultados.length === 0 && (
            <p className="text-xs text-slate-400 py-3 text-center">Nenhum militar encontrado.</p>
          )}
          {resultados.map((u) => {
            const lotado = Boolean(u.grupamento_atual);
            const indisponivel = desabilitarLotados && lotado;
            return (
              <button
                key={u.id}
                disabled={confirmando || indisponivel}
                onClick={() => !indisponivel && onSelecionar(u)}
                title={indisponivel ? `Indisponível — já lotado no Grupamento ${u.grupamento_atual}` : undefined}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-lg transition text-left disabled:cursor-not-allowed ${
                  indisponivel
                    ? "bg-slate-100 border-slate-200 opacity-60 grayscale"
                    : "bg-slate-50 hover:bg-indigo-50 border-slate-200 disabled:opacity-50"
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-sm truncate ${indisponivel ? "text-slate-500" : "text-slate-700"}`}>
                    {u.nome}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {u.sigla_patente && u.sigla_patente !== "N/A" ? `${u.sigla_patente} · ` : ""}
                    {formatarMatricula(u.matricula)} · {formatarCpf(u.cpf)}
                  </p>
                  {lotado && (
                    <p className={`text-[11px] font-semibold mt-0.5 ${indisponivel ? "text-slate-400" : "text-amber-600"}`}>
                      Lotado no Grupamento {u.grupamento_atual}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold flex-shrink-0 ${
                    indisponivel ? "text-slate-400" : "text-indigo-600"
                  }`}
                >
                  {indisponivel ? "Indisponível" : rotuloAcao}
                </span>
              </button>
            );
          })}
        </div>

        {listaFiltrada.length > TAMANHO_PAGINA && (
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              {(paginaAtual - 1) * TAMANHO_PAGINA + 1}–
              {Math.min(paginaAtual * TAMANHO_PAGINA, listaFiltrada.length)} de {listaFiltrada.length}
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