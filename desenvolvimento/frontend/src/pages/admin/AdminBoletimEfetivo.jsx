import React, { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Printer, AlertTriangle, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import brasaoSergipe from "../../assets/brasao_sergipe_pb.svg";

const GRUPAMENTOS = [
  { id_grupamento: 1, sigla: "A" },
  { id_grupamento: 2, sigla: "B" },
  { id_grupamento: 3, sigla: "C" },
  { id_grupamento: 4, sigla: "D" },
  { id_grupamento: 5, sigla: "E" },
  { id_grupamento: 6, sigla: "F" },
];

const SECOES = [
  { chave: "FERIAS", titulo: "Férias regulamentares" },
  { chave: "FERIAS_LEI_109", titulo: "Férias regulamentares/LE — Lei 109" },
  { chave: "LICENCA_ESPECIAL", titulo: "Licença especial" },
  { chave: "CURSO", titulo: "Cursos" },
  { chave: "RESTRICAO_GERAL", titulo: "Restrições gerais" },
  { chave: "RESTRICAO_NOTURNA", titulo: "Restrições noturnas" },
  { chave: "ESCALA_DIFERENCIADA", titulo: "Escala diferenciada" },
  { chave: "REDUCAO_CARGA", titulo: "Redução de carga horária" },
  { chave: "AFASTAMENTO", titulo: "Afastamento" },
];

const ROTULOS_RESUMO = [
  { chave: "efetivo_de_servico", titulo: "Efetivo de serviço" },
  { chave: "efetivo_escala_diferenciada", titulo: "Efetivo com escala diferenciada" },
  { chave: "efetivo_servico_noturno", titulo: "Efetivo em serviço noturno" },
  { chave: "efetivo_curso", titulo: "Efetivo com afastamento (curso)" },
  { chave: "efetivo_ferias", titulo: "Efetivo em férias" },
  { chave: "efetivo_licenca_especial", titulo: "Efetivo em licença especial" },
  { chave: "efetivo_reducao_carga", titulo: "Efetivo com redução de carga horária" },
  { chave: "efetivo_afastamento", titulo: "Efetivo em afastamento" },
];

function mesAtualISO() {
  const hoje = new Date();
  return `${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
}

// "MM/AAAA" -> { inicio: "AAAA-MM-01", fim: "AAAA-MM-<ultimoDia>" }
function calcularLimitesMes(mesReferencia) {
  const [mesStr, anoStr] = mesReferencia.split("/");
  const mes = Number(mesStr);
  const ano = Number(anoStr);
  if (!mes || !ano || mes < 1 || mes > 12) return null;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return {
    inicio: `${ano}-${String(mes).padStart(2, "0")}-01`,
    fim: `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

function formatarDataBR(dataISO) {
  if (!dataISO) return null;
  const [ano, mes, dia] = dataISO.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

// Nome/cargo de quem assina o boletim ficam salvos só neste navegador
// (localStorage) — não é um dado do sistema (não tem "o" responsável fixo
// no banco), é só pra não precisar redigitar toda vez que reimprimir.
const CHAVE_NOME_RESPONSAVEL = "boletim_efetivo_nome_responsavel";
const CHAVE_CARGO_RESPONSAVEL = "boletim_efetivo_cargo_responsavel";

export default function AdminBoletimEfetivo() {
  const navigate = useNavigate();

  const [mesReferencia, setMesReferencia] = useState(mesAtualISO());
  const [grupamentoFiltro, setGrupamentoFiltro] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [boletim, setBoletim] = useState(null);
  const [rosters, setRosters] = useState({});

  // Nome e cargo de quem assina — editável direto na página (ver rodapé do
  // boletim). Carrega do que foi digitado da última vez, se houver.
  const [nomeResponsavel, setNomeResponsavel] = useState(
    () => localStorage.getItem(CHAVE_NOME_RESPONSAVEL) || "",
  );
  const [cargoResponsavel, setCargoResponsavel] = useState(
    () => localStorage.getItem(CHAVE_CARGO_RESPONSAVEL) || "",
  );

  useEffect(() => {
    localStorage.setItem(CHAVE_NOME_RESPONSAVEL, nomeResponsavel);
  }, [nomeResponsavel]);

  useEffect(() => {
    localStorage.setItem(CHAVE_CARGO_RESPONSAVEL, cargoResponsavel);
  }, [cargoResponsavel]);

  // Título da aba = nome sugerido pro PDF quando o navegador salva via
  // "Imprimir" (o Chrome usa document.title como nome do arquivo). Ano e
  // mês vêm de um Date real (não de recorte de string), garantindo que
  // reflitam o período do boletim mesmo se o campo de texto mudar de
  // formato no futuro. Restaura "E-scala" ao sair da página.
  useEffect(() => {
    const limites = calcularLimitesMes(mesReferencia);
    if (limites) {
      const data = new Date(`${limites.inicio}T00:00:00`);
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      document.title = `${ano}_${mes}_boletim`;
    }
    return () => {
      document.title = "E-scala";
    };
  }, [mesReferencia]);

  // Carimbo de data/hora do MOMENTO EM QUE O ADMINISTRADOR SALVA o
  // arquivo (não de quando a tela foi aberta) — ano, mês, dia, hora,
  // minuto e segundo reais, lidos de um novo Date() na hora do clique.
  // Formato AAAAMMDD_HHMMSS: só dígitos e "_", nunca inválido como nome
  // de arquivo em nenhum sistema operacional.
  function montarCarimboAgora() {
    const agora = new Date();
    const p2 = (n) => String(n).padStart(2, "0");
    return (
      `${agora.getFullYear()}${p2(agora.getMonth() + 1)}${p2(agora.getDate())}` +
      `_${p2(agora.getHours())}${p2(agora.getMinutes())}${p2(agora.getSeconds())}`
    );
  }

  function imprimirComNomeCarimbado() {
    const limites = calcularLimitesMes(mesReferencia);
    const tituloAntes = document.title;
    if (limites) {
      const data = new Date(`${limites.inicio}T00:00:00`);
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      document.title = `${ano}_${mes}_${montarCarimboAgora()}_boletim`;
    }
    window.print();
    // O nome já foi capturado pelo diálogo de impressão/salvar no
    // momento do print(); depois disso o título volta ao normal (só
    // "AAAA_MM_boletim"), sem o carimbo, pra não ficar visível na aba.
    document.title = tituloAntes;
  }

  const gerar = useCallback(async () => {
    const limites = calcularLimitesMes(mesReferencia);
    if (!limites) {
      setErro("Informe o mês no formato MM/AAAA.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const { data } = await api.post("/afastamentos/boletim", {
        data_inicio: limites.inicio,
        data_fim: limites.fim,
        fk_id_grupamento: grupamentoFiltro || undefined,
      });
      setBoletim(data);

      const gruposParaBuscar = grupamentoFiltro
        ? GRUPAMENTOS.filter((g) => String(g.id_grupamento) === String(grupamentoFiltro))
        : GRUPAMENTOS;

      const entradas = await Promise.all(
        gruposParaBuscar.map(async (g) => {
          try {
            const resp = await api.get(`/escalas/grupamento/${g.id_grupamento}/membros`);
            return [g.sigla, resp.data];
          } catch {
            return [g.sigla, []];
          }
        }),
      );
      setRosters(Object.fromEntries(entradas));
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível gerar o boletim.");
      setBoletim(null);
    } finally {
      setLoading(false);
    }
  }, [mesReferencia, grupamentoFiltro]);

  useEffect(() => {
    gerar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm print:hidden">
        <div className="px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              Boletim do Efetivo
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Justificativa do cartão-alimentação — gerado a partir dos dados do sistema
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
              onClick={() => navigate("/admin/afastamentos")}
              className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white text-sm font-medium rounded-lg hover:bg-green-900 transition shadow-sm"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          </div>
        </div>
      </header>

      {/* Controles — somem na impressão */}
      <div className="max-w-4xl mx-auto p-4 md:p-8 print:hidden">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mês (MM/AAAA)</label>
            <input
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
              placeholder="09/2026"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Equipe (opcional)</label>
            <select
              value={grupamentoFiltro}
              onChange={(e) => setGrupamentoFiltro(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas as equipes</option>
              {GRUPAMENTOS.map((g) => (
                <option key={g.id_grupamento} value={g.id_grupamento}>
                  Equipe {g.sigla}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={gerar}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Gerando..." : "Gerar"}
          </button>
          {boletim && (
            <button
              onClick={imprimirComNomeCarimbado}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition ml-auto"
            >
              <Printer size={15} />
              Imprimir / Gerar PDF
            </button>
          )}
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            {erro}
          </div>
        )}
      </div>

      {/* ===================== CONTEÚDO DO BOLETIM (imprimível) ===================== */}
      {boletim && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-16 print:p-0 print:max-w-none">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-10 print:border-0 print:shadow-none print:rounded-none">
            <div className="text-center mb-6 pb-4 border-b-2 border-slate-800">
              {/* Tamanho em "cm" (não em px/rem) de propósito — o alvo
                  desta tela é o papel impresso/PDF, então o brasão precisa
                  ficar proporcional à página física (A4), não à janela do
                  navegador. */}
              <img
                src={brasaoSergipe}
                alt="Brasão de Sergipe"
                style={{ width: "2.2cm", height: "auto" }}
                className="mx-auto mb-2"
              />
              <p className="text-sm font-bold uppercase tracking-wide">Governo de Sergipe</p>
              <p className="text-sm font-bold uppercase tracking-wide">
                Secretaria de Estado da Segurança Pública
              </p>
              <p className="text-sm font-bold uppercase tracking-wide">COPOM/PMSE</p>
              <p className="mt-3 text-base font-bold">Boletim do Efetivo — Justificativa Cartão-Alimentação</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Período: {formatarDataBR(boletim.periodo.data_inicio)} a {formatarDataBR(boletim.periodo.data_fim)}
                {grupamentoFiltro
                  ? ` · Equipe ${GRUPAMENTOS.find((g) => String(g.id_grupamento) === String(grupamentoFiltro))?.sigla}`
                  : " · Todas as equipes"}
              </p>
            </div>

            {/* Roster por equipe */}
            <section className="mb-8 break-inside-avoid">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-2 bg-slate-100 px-2 py-1">
                Efetivo por equipe
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(rosters).map(([sigla, membros]) => (
                  <div key={sigla} className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                    <div className="bg-slate-800 text-white px-2 py-1 font-bold">
                      Equipe {sigla} ({membros.length})
                    </div>
                    <div className="divide-y divide-slate-100">
                      {membros.map((m) => (
                        <div key={m.id_user} className="px-2 py-1">
                          {m.sigla_patente || ""} {m.matricula} {(m.nome_guerra || m.nome || "").toUpperCase()}
                        </div>
                      ))}
                      {membros.length === 0 && <div className="px-2 py-1 text-slate-400">Sem militares</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Seções de afastamento */}
            {SECOES.map((sec) => {
              const itens = boletim.secoes[sec.chave] || [];
              return (
                <section key={sec.chave} className="mb-6 break-inside-avoid">
                  <h2 className="text-sm font-bold uppercase tracking-wide mb-2 bg-slate-100 px-2 py-1">
                    {sec.titulo}
                  </h2>
                  {itens.length === 0 ? (
                    <p className="text-xs text-slate-400 px-2">Nenhum registro neste período.</p>
                  ) : (
                    <ul className="text-xs space-y-1.5 px-2">
                      {itens.map((it) => (
                        <li key={it.id_afastamento} className="border-l-2 border-slate-300 pl-2">
                          <span className="font-semibold">
                            {it.sigla_patente ? `${it.sigla_patente} ` : ""}
                            {it.matricula} {(it.nome_guerra || it.nome || "").toUpperCase()}
                          </span>{" "}
                          — {formatarDataBR(it.data_inicio)} a{" "}
                          {it.data_fim ? formatarDataBR(it.data_fim) : "prazo indeterminado"}
                          {it.bgo_referencia ? ` · BGO ${it.bgo_referencia}` : ""}
                          {it.turnos?.length > 0
                            ? ` · ${it.modo_restricao === "SOMENTE" ? "Somente" : "Exceto"} turno ${it.turnos.join("º, ")}º`
                            : ""}
                          {it.grupamentos?.length > 0 ? ` · Equipe(s) ${it.grupamentos.join(", ")}` : ""}
                          {it.motivos?.length > 0 ? ` · ${it.motivos.join(", ")}` : ""}
                          {it.observacao ? ` · ${it.observacao}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}

            {/* Resumo */}
            <section className="break-inside-avoid">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-2 bg-slate-100 px-2 py-1">
                Resumo do efetivo
              </h2>
              <p className="text-[11px] text-slate-400 mb-2 px-2">
                Fotografia do dia {formatarDataBR(boletim.data_referencia)} (não é soma do período inteiro — cada
                linha reflete quem está naquela situação especificamente nessa data)
              </p>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {ROTULOS_RESUMO.map((r) => (
                    <tr key={r.chave} className="border-b border-slate-200">
                      <td className="py-1.5 px-2">{r.titulo}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-semibold">
                        {boletim.resumo[r.chave]}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td className="py-1.5 px-2">Total do efetivo</td>
                    <td className="py-1.5 px-2 text-right font-mono">{boletim.resumo.total_efetivo}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Assinatura de quem fecha o boletim — editável direto aqui.
                Fica salvo neste navegador (localStorage), então não
                precisa redigitar toda vez que reimprimir no mesmo
                computador. Sempre na última página, por isso
                "break-inside-avoid" mais uma margem superior generosa. */}
            <section className="mt-16 pt-6 border-t border-slate-300 break-inside-avoid">
              <div className="w-72 mx-auto text-center print:hidden mb-1">
                <p className="text-[10px] text-slate-400">Clique nos campos abaixo pra editar</p>
              </div>
              <div className="w-72 mx-auto text-center">
                <input
                  type="text"
                  value={nomeResponsavel}
                  onChange={(e) => setNomeResponsavel(e.target.value)}
                  placeholder="Nome do responsável"
                  className="w-full text-center text-sm font-semibold text-slate-800 bg-transparent border-0 border-b border-slate-400 focus:outline-none focus:border-indigo-500 pb-1 placeholder:font-normal placeholder:text-slate-400 print:placeholder:text-transparent"
                />
                <input
                  type="text"
                  value={cargoResponsavel}
                  onChange={(e) => setCargoResponsavel(e.target.value)}
                  placeholder="Posto/graduação e função (ex: 2º TEN QOAPM — Auxiliar do COPOM/PMSE)"
                  className="w-full text-center text-xs text-slate-500 bg-transparent border-0 focus:outline-none mt-1.5 placeholder:text-slate-400 print:placeholder:text-transparent"
                />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
