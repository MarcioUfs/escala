import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  CalendarCheck,
  CalendarX,
  Clock,
  Plus,
  Search,
  UserMinus,
} from "lucide-react";
import api from "../services/api";

const PERIODOS = [
  { id: "prox30", rotulo: "Próximos 30 dias", inicio: 0, fim: 30 },
  { id: "prox60", rotulo: "Próximos 60 dias", inicio: 0, fim: 60 },
  { id: "prox90", rotulo: "Próximos 90 dias", inicio: 0, fim: 90 },
  { id: "ult30", rotulo: "Últimos 30 dias", inicio: -30, fim: 0 },
];

const PERIODO_PERSONALIZADO = "personalizado";
const LIMITE_DIAS = 1830; // mesmo limite do backend (~5 anos)

function diferencaDias(inicioISO, fimISO) {
  const [a1, m1, d1] = inicioISO.split("-").map(Number);
  const [a2, m2, d2] = fimISO.split("-").map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

// Devolve a mensagem de erro do intervalo escolhido, ou null se estiver ok.
function validarIntervalo(inicio, fim) {
  if (!inicio || !fim) return "Informe a data inicial e a data final.";
  if (fim < inicio) return "A data final não pode ser anterior à data inicial.";
  if (diferencaDias(inicio, fim) > LIMITE_DIAS) return "O período máximo é de 5 anos.";
  return null;
}

const DIAS_SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const STATUS_PERMUTA = {
  AGUARDANDO_ALVO: "aguardando confirmação do militar",
  AGUARDANDO_ADMIN: "aguardando análise do administrador",
};

function isoLocal(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function somarDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return isoLocal(d);
}

function partesDaData(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return { ano, mes, dia, semana: new Date(ano, mes - 1, dia).getDay() };
}

function dataBR(iso) {
  const { ano, mes, dia } = partesDaData(iso);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}

const nomeDe = (c) => (c ? c.nome_guerra || c.nome : "outro militar");

// Linha de um turno dentro do dia. O texto sempre diz, em palavras, o que
// aconteceu e com quem — nada de depender só de cor ou de ícone.
function LinhaTurno({ item }) {
  const turno = `${item.turno}º turno · ${item.hora_inicio}–${item.hora_fim} · Grupamento ${item.grupamento}`;

  const estilos = {
    ESCALA: { icone: CalendarCheck, cor: "bg-emerald-100 text-emerald-800", rotulo: "Escala" },
    PERMUTA: { icone: ArrowLeftRight, cor: "bg-purple-100 text-purple-800", rotulo: "Permuta" },
    ADICAO: { icone: Plus, cor: "bg-sky-100 text-sky-800", rotulo: "Inclusão manual" },
    PREVISTO: { icone: Clock, cor: "bg-amber-100 text-amber-800", rotulo: "Previsto (permuta pendente)" },
    CEDIDO: { icone: ArrowLeftRight, cor: "bg-slate-200 text-slate-700", rotulo: "Dia cedido" },
    DISPENSA: { icone: UserMinus, cor: "bg-slate-200 text-slate-700", rotulo: "Dispensa" },
  }[item.tipo];
  const Icone = estilos.icone;
  const inativo = item.tipo === "CEDIDO" || item.tipo === "DISPENSA";

  return (
    <div
      className={`p-3 rounded-lg border ${
        item.tipo === "PREVISTO" ? "border-dashed border-amber-300 bg-amber-50/50" : "border-slate-200 bg-white"
      } ${inativo ? "opacity-80" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${estilos.cor}`}
        >
          <Icone size={12} />
          {estilos.rotulo}
        </span>
        <span className={`text-sm font-semibold text-slate-800 ${inativo ? "line-through decoration-slate-400" : ""}`}>
          {turno}
        </span>
      </div>

      {item.tipo === "PERMUTA" && (
        <p className="mt-1.5 text-sm text-slate-700">
          Você assume este serviço de <strong>{nomeDe(item.contraparte)}</strong> (permuta aprovada
          {item.protocolo ? `, protocolo ${item.protocolo}` : ""}).
        </p>
      )}
      {item.tipo === "CEDIDO" && (
        <p className="mt-1.5 text-sm text-slate-700">
          Você <strong>não trabalha</strong> neste turno: <strong>{nomeDe(item.contraparte)}</strong> assume o seu serviço
          (permuta aprovada{item.protocolo ? `, protocolo ${item.protocolo}` : ""}).
        </p>
      )}
      {item.tipo === "DISPENSA" && (
        <p className="mt-1.5 text-sm text-slate-700">
          Você foi retirado(a) da escala neste turno{item.observacao ? ` — ${item.observacao}` : ""}.
        </p>
      )}
      {item.tipo === "ADICAO" && (
        <p className="mt-1.5 text-sm text-slate-700">
          Incluído(a) manualmente pela administração{item.observacao ? ` — ${item.observacao}` : ""}.
        </p>
      )}
      {item.tipo === "PREVISTO" && (
        <p className="mt-1.5 text-sm text-slate-700">
          Se a permuta {item.protocolo} for aprovada, você assumirá este serviço de{" "}
          <strong>{nomeDe(item.contraparte)}</strong> — {STATUS_PERMUTA[item.status_permuta] || "em andamento"}.
        </p>
      )}

      {(item.permutas_pendentes || []).map((p) => (
        <p
          key={p.protocolo}
          className="mt-1.5 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1"
        >
          Permuta pendente {p.protocolo} ({STATUS_PERMUTA[p.status] || "em andamento"}): você cederia este serviço a{" "}
          <strong>{nomeDe(p.contraparte)}</strong> e assumiria o dia {dataBR(p.recebe.data)} ({p.recebe.turno}º turno).
        </p>
      ))}
    </div>
  );
}

function CartaoDia({ dia }) {
  const { semana, dia: numero, mes, ano } = partesDaData(dia.data);
  const temErro = dia.avisos.some((a) => a.gravidade === "erro");
  const temAviso = dia.avisos.length > 0;
  const semServico = !dia.itens.some((i) => ["ESCALA", "PERMUTA", "ADICAO"].includes(i.tipo));

  return (
    <article
      className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
        temErro ? "border-red-300 ring-1 ring-red-100" : temAviso ? "border-amber-300" : "border-slate-200"
      }`}
    >
      <header
        className={`px-4 py-2.5 flex flex-wrap items-baseline justify-between gap-x-3 border-b ${
          temErro ? "bg-red-50 border-red-100" : temAviso ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"
        }`}
      >
        <h3 className="text-sm font-bold text-slate-800">
          {String(numero).padStart(2, "0")}/{String(mes).padStart(2, "0")}/{ano}
          <span className="ml-2 font-medium text-slate-500 capitalize">{DIAS_SEMANA[semana]}</span>
        </h3>
        {temAviso && (
          <span className={`text-xs font-semibold ${temErro ? "text-red-700" : "text-amber-700"}`}>
            {dia.avisos.length} {dia.avisos.length === 1 ? "aviso" : "avisos"}
          </span>
        )}
      </header>

      <div className="p-3 space-y-2">
        {dia.itens.map((item, i) => (
          <LinhaTurno key={`${item.tipo}-${item.turno}-${item.protocolo || ""}-${i}`} item={item} />
        ))}
        {semServico && dia.itens.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum serviço neste dia — há apenas avisos relacionados a uma permuta.</p>
        )}

        {dia.avisos.map((a, i) => (
          <div
            key={`${a.codigo}-${i}`}
            role="alert"
            className={`flex items-start gap-2 p-2.5 rounded-lg border text-sm ${
              a.gravidade === "erro"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            {a.gravidade === "erro" ? (
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            )}
            <span>
              <strong>{a.gravidade === "erro" ? "Conflito: " : "Atenção: "}</strong>
              {a.mensagem}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function MeusDiasServico() {
  const [periodoId, setPeriodoId] = useState("prox30");
  // Intervalo livre: "personalizado" é o rascunho dos campos de data;
  // "aplicado" é o que de fato está sendo consultado (só muda no botão Buscar).
  const [personalizado, setPersonalizado] = useState({ inicio: somarDias(0), fim: somarDias(30) });
  const [aplicado, setAplicado] = useState({ inicio: somarDias(0), fim: somarDias(30) });
  const [recarga, setRecarga] = useState(0);
  const [somenteAvisos, setSomenteAvisos] = useState(false);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const emPersonalizado = periodoId === PERIODO_PERSONALIZADO;
  const atalho = PERIODOS.find((p) => p.id === periodoId);
  const inicioConsulta = emPersonalizado ? aplicado.inicio : somarDias(atalho.inicio);
  const fimConsulta = emPersonalizado ? aplicado.fim : somarDias(atalho.fim);
  const erroRascunho = emPersonalizado ? validarIntervalo(personalizado.inicio, personalizado.fim) : null;

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      try {
        const { data } = await api.get("/minha-escala/meus-dias", {
          params: { data_inicio: inicioConsulta, data_fim: fimConsulta },
        });
        if (!cancelado) setDados(data);
      } catch (err) {
        if (!cancelado) setErro(err.response?.data?.msg || "Não foi possível carregar os seus dias de serviço.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [inicioConsulta, fimConsulta, recarga]);

  function trocarPeriodo(id) {
    if (id === periodoId) return;
    if (id === PERIODO_PERSONALIZADO) {
      // Parte do intervalo que já está na tela, para o usuário só ajustar.
      // Nada é recarregado: as datas são as mesmas até clicar em Buscar.
      setPersonalizado({ inicio: inicioConsulta, fim: fimConsulta });
      setAplicado({ inicio: inicioConsulta, fim: fimConsulta });
      setPeriodoId(id);
      return;
    }
    setCarregando(true);
    setErro(null);
    setPeriodoId(id);
  }

  function buscarPersonalizado(e) {
    e.preventDefault();
    if (erroRascunho) return;
    setCarregando(true);
    setErro(null);
    setAplicado({ ...personalizado });
    setRecarga((n) => n + 1);
  }

  // A lista é sempre cronológica (do mais antigo para o mais novo), inclusive
  // em "Últimos 30 dias".
  const diasVisiveis = useMemo(() => {
    const dias = dados?.dias || [];
    return somenteAvisos ? dias.filter((d) => d.avisos.length > 0) : dias;
  }, [dados, somenteAvisos]);

  const meses = useMemo(() => {
    const grupos = [];
    for (const dia of diasVisiveis) {
      const { ano, mes } = partesDaData(dia.data);
      const rotulo = `${MESES[mes - 1]} de ${ano}`;
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.rotulo === rotulo) ultimo.dias.push(dia);
      else grupos.push({ rotulo, dias: [dia] });
    }
    return grupos;
  }, [diasVisiveis]);

  return (
    <section className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
          {[...PERIODOS, { id: PERIODO_PERSONALIZADO, rotulo: "Escolher datas" }].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => trocarPeriodo(p.id)}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition ${
                p.id === periodoId ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={somenteAvisos}
            onChange={(e) => setSomenteAvisos(e.target.checked)}
            className="rounded border-slate-300"
          />
          Só dias com aviso
        </label>
      </div>

      {emPersonalizado && (
        <form onSubmit={buscarPersonalizado} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              De
              <input
                type="date"
                value={personalizado.inicio}
                max={personalizado.fim || undefined}
                onChange={(e) => setPersonalizado((p) => ({ ...p, inicio: e.target.value }))}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Até
              <input
                type="date"
                value={personalizado.fim}
                min={personalizado.inicio || undefined}
                onChange={(e) => setPersonalizado((p) => ({ ...p, fim: e.target.value }))}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
            <button
              type="submit"
              disabled={!!erroRascunho || carregando}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search size={15} />
              {carregando ? "Buscando..." : "Buscar"}
            </button>
          </div>
          <p className="text-xs text-slate-400">Qualquer intervalo, até 5 anos.</p>
          {erroRascunho && (
            <p role="alert" className="text-xs text-red-600">
              {erroRascunho}
            </p>
          )}
        </form>
      )}

      {dados && !carregando && (
        <p className="text-sm text-slate-600">
          <strong>{dados.resumo.total_dias_servico}</strong>{" "}
          {dados.resumo.total_dias_servico === 1 ? "dia de serviço" : "dias de serviço"} entre {dataBR(dados.data_inicio)} e{" "}
          {dataBR(dados.data_fim)}
          {dados.resumo.total_com_aviso > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-red-700">
                {dados.resumo.total_com_aviso} {dados.resumo.total_com_aviso === 1 ? "dia com aviso" : "dias com avisos"}
              </span>
            </>
          )}
        </p>
      )}

      {carregando && (
        <div className="flex h-48 items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-emerald-600" />
        </div>
      )}

      {!carregando && erro && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-center gap-3 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          {erro}
        </div>
      )}

      {!carregando && !erro && diasVisiveis.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <CalendarX className="text-slate-300" size={40} />
          <p className="text-slate-500 text-sm max-w-sm">
            {somenteAvisos
              ? "Nenhum dia com aviso neste período."
              : "Você não tem dias de serviço neste período."}
          </p>
        </div>
      )}

      {!carregando &&
        !erro &&
        meses.map((grupo) => (
          <div key={grupo.rotulo} className="space-y-3">
            <h2 className="pt-2 text-xs font-bold uppercase tracking-wider text-slate-400 capitalize">{grupo.rotulo}</h2>
            {grupo.dias.map((dia) => (
              <CartaoDia key={dia.data} dia={dia} />
            ))}
          </div>
        ))}
    </section>
  );
}
