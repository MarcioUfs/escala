import { useEffect, useRef, useState } from "react";
import { Printer, AlertTriangle } from "lucide-react";
import brasaoSergipe from "../assets/brasao_sergipe_pb.svg";

// ---------------------------------------------------------------------------
// Relatório de permutas de serviço — mesmo formato do boletim oficial do
// COPOM/PMSE usado como referência (uma linha para o militar que tem o
// serviço permutado e outra para quem paga, com a data e o turno), com uma
// bloco de informações detalhadas logo abaixo de cada permuta (opcional). Cabeçalho, assinatura editável e paginação com número de página
// seguem o mesmo padrão de "Escala dos Despachantes" (pagedjs).
// ---------------------------------------------------------------------------

const CHAVE_NOME_RESPONSAVEL = "permutas_nome_responsavel";
const CHAVE_CARGO_RESPONSAVEL = "permutas_cargo_responsavel";
const CHAVE_FUNCAO_RESPONSAVEL = "permutas_funcao_responsavel";

// Mesmas regras de página de AdminEscalaDespachantes: A4, numeração "1/8" no
// canto inferior direito e cores de fundo sempre impressas (a faixa amarela
// do título some se o navegador não imprimir "gráficos em segundo plano").
const REGRAS_PAGINA = `
  @page {
    size: A4;
    margin: 1.4cm 1.1cm 1.3cm 1.1cm;
    @bottom-right {
      content: counter(page) "/" counter(pages);
      font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
      font-size: 9px;
      color: #64748b;
    }
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
`;

const ROTULO_STATUS = {
  AGUARDANDO_ALVO: "Solicitada — aguardando confirmação do militar alvo",
  AGUARDANDO_ADMIN: "Solicitada — aguardando análise do administrador",
  APROVADA: "Aceita (aprovada)",
  RECUSADA_ALVO: "Negada pelo militar alvo",
  RECUSADA_ADMIN: "Negada pelo administrador",
};

function partes(iso) {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  return { ano, mes, dia };
}

function dataBR(iso) {
  const { ano, mes, dia } = partes(iso);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}

function dataHoraBR(valor) {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Maceio" });
}

// "2026-07-04" + 1 -> "04/07/2026 (1T)"
function servico(iso, turno) {
  return `${dataBR(iso)} (${turno}T)`;
}

// Intervalo dentro de um único mês -> "JULHO 2026"; senão, o intervalo
// completo por extenso, "01/07/2026 A 31/08/2026".
function tituloPeriodo(dataInicio, dataFim) {
  const a = partes(dataInicio);
  const b = partes(dataFim);
  if (a.ano === b.ano && a.mes === b.mes) {
    const nomeMes = new Date(a.ano, a.mes - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
    return `${nomeMes.toUpperCase()} ${a.ano}`;
  }
  return `${dataBR(dataInicio)} A ${dataBR(dataFim)}`;
}

const nomeMilitar = (guerra, nome) => (guerra || nome || "").toUpperCase();

// Informações detalhadas — só entram no documento quando o admin marca a
// opção ao gerar: protocolo, situação, data da solicitação, motivos e o
// responsável pela decisão (com a data). A aprovação não tem motivo (basta o
// aceite do administrador); só a solicitação e a negativa.
function detalhesDaPermuta(p) {
  const linhas = [
    `Protocolo ${p.protocolo} · Situação: ${ROTULO_STATUS[p.status] || p.status} · Solicitada em ${dataHoraBR(p.created_at)}`,
    `Motivo da solicitação: ${p.motivo_solicitacao}`,
  ];

  const admin = p.nome_admin_analise || "administrador";
  const decisao = dataHoraBR(p.updated_at);

  if (p.status === "APROVADA") {
    linhas.push(`Aprovada por ${admin} em ${decisao}`);
  } else if (p.status === "RECUSADA_ALVO") {
    linhas.push(
      `Motivo da negativa: ${p.motivo_recusa_alvo || "não informado"} · Negada por ${nomeMilitar(
        p.nome_guerra_alvo,
        p.nome_alvo,
      )} em ${decisao}`,
    );
  } else if (p.status === "RECUSADA_ADMIN") {
    linhas.push(`Motivo da negativa: ${p.motivo_recusa_admin || "não informado"} · Negada por ${admin} em ${decisao}`);
  }
  return linhas;
}

export default function RelatorioPermutas({ permutas, dataInicio, dataFim, situacoes }) {
  const [erro, setErro] = useState(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  // Escolha feita na hora de gerar o documento. Desmarcado (padrão), sai só a
  // tabela dos militares e das datas, como no modelo oficial.
  const [incluirDetalhes, setIncluirDetalhes] = useState(false);

  const [nomeResponsavel, setNomeResponsavel] = useState(
    () => localStorage.getItem(CHAVE_NOME_RESPONSAVEL) || "",
  );
  const [cargoResponsavel, setCargoResponsavel] = useState(
    () => localStorage.getItem(CHAVE_CARGO_RESPONSAVEL) || "",
  );
  const [funcaoResponsavel, setFuncaoResponsavel] = useState(
    () => localStorage.getItem(CHAVE_FUNCAO_RESPONSAVEL) || "Auxiliar do COPOM/PMSE",
  );

  useEffect(() => {
    localStorage.setItem(CHAVE_NOME_RESPONSAVEL, nomeResponsavel);
  }, [nomeResponsavel]);
  useEffect(() => {
    localStorage.setItem(CHAVE_CARGO_RESPONSAVEL, cargoResponsavel);
  }, [cargoResponsavel]);
  useEffect(() => {
    localStorage.setItem(CHAVE_FUNCAO_RESPONSAVEL, funcaoResponsavel);
  }, [funcaoResponsavel]);

  const conteudoRef = useRef(null);
  const pagedContainerRef = useRef(null);

  const periodoTitulo = tituloPeriodo(dataInicio, dataFim);

  async function imprimirPaginado() {
    if (!conteudoRef.current || !pagedContainerRef.current) return;
    setGerandoPdf(true);
    setErro(null);
    const tituloAntes = document.title;
    try {
      // Timestamp diferente a cada clique, para o PDF salvo nunca sobrescrever o anterior.
      document.title = `Permutas de serviço ${periodoTitulo.replace(/\//g, "-")} ${new Date().getTime()}`;

      const { Previewer } = await import("pagedjs");
      const folhasCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((l) => l.href);

      pagedContainerRef.current.innerHTML = "";
      const previewer = new Previewer();
      await previewer.preview(
        conteudoRef.current.innerHTML,
        [...folhasCss, { "permutas-page-rules": REGRAS_PAGINA }],
        pagedContainerRef.current,
      );

      window.print();
    } catch {
      setErro("Não foi possível preparar a paginação para impressão. Tente novamente.");
    } finally {
      document.title = tituloAntes;
      setGerandoPdf(false);
    }
  }

  const linhaAssinatura =
    nomeResponsavel || cargoResponsavel
      ? `${nomeResponsavel}${nomeResponsavel && cargoResponsavel ? " – " : ""}${cargoResponsavel}`
      : " ";
  const linhaFuncao = funcaoResponsavel || " ";

  // O pagedjs monta as páginas a partir do innerHTML (uma string), e o valor
  // digitado num <input> controlado não vai para esse HTML — por isso ficam
  // duas versões da assinatura: os campos (só em tela) e o texto simples (só
  // no documento impresso).
  const assinaturaJsx = (
    <section className="mt-16 pt-6" style={{ breakInside: "avoid" }}>
      <div className="w-80 mx-auto text-center print:hidden mb-1">
        <p className="text-[10px] text-slate-400">Clique nos campos abaixo para editar a assinatura</p>
      </div>
      <div className="w-80 mx-auto text-center print:hidden">
        <div className="flex items-baseline justify-center gap-1 text-sm font-bold text-slate-800 border-b border-slate-400 pb-1">
          <input
            type="text"
            value={nomeResponsavel}
            onChange={(e) => setNomeResponsavel(e.target.value)}
            placeholder="Nome do responsável"
            className="flex-1 min-w-0 text-right bg-transparent border-0 focus:outline-none placeholder:font-normal placeholder:text-slate-400"
          />
          <span>–</span>
          <input
            type="text"
            value={cargoResponsavel}
            onChange={(e) => setCargoResponsavel(e.target.value)}
            placeholder="Posto (ex: 2º Ten QOAPM)"
            className="flex-1 min-w-0 text-left bg-transparent border-0 focus:outline-none placeholder:font-normal placeholder:text-slate-400"
          />
        </div>
        <input
          type="text"
          value={funcaoResponsavel}
          onChange={(e) => setFuncaoResponsavel(e.target.value)}
          placeholder="Função (ex: Auxiliar do COPOM/PMSE)"
          className="w-full text-sm text-center text-slate-700 bg-transparent border-0 focus:outline-none mt-1 placeholder:text-slate-400"
        />
      </div>
      <div className="hidden print:block w-80 mx-auto text-center">
        <p className="text-sm font-bold text-slate-800 border-b border-slate-400 pb-1">{linhaAssinatura}</p>
        <p className="text-sm text-slate-700 mt-1">{linhaFuncao}</p>
      </div>
    </section>
  );

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-16 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">Relatório de permutas</h2>
            <p className="text-xs text-slate-500">
              {permutas.length} {permutas.length === 1 ? "permuta" : "permutas"} · {situacoes}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={incluirDetalhes}
                onChange={(e) => setIncluirDetalhes(e.target.checked)}
                className="rounded border-slate-300"
              />
              Incluir informações detalhadas (protocolo, situação, datas, responsável e motivos)
            </label>
            <button
              onClick={imprimirPaginado}
              disabled={gerandoPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition disabled:opacity-50"
            >
              <Printer size={15} />
              {gerandoPdf ? "Preparando..." : "Imprimir / Gerar PDF"}
            </button>
          </div>
        </div>

        {erro && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            {erro}
          </div>
        )}

        <div ref={conteudoRef} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-10">
          {/* Cabeçalho padrão dos documentos gerados pelo sistema */}
          <div className="text-center mb-6 pb-4 border-b-2 border-slate-800">
            <img
              src={brasaoSergipe}
              alt="Brasão de Sergipe"
              style={{ width: "2.2cm", height: "auto" }}
              className="mx-auto mb-2"
            />
            <p className="text-sm font-bold uppercase tracking-wide">Governo de Sergipe</p>
            <p className="text-sm font-bold uppercase tracking-wide">Secretaria de Estado da Segurança Pública</p>
            <p className="text-sm font-bold uppercase tracking-wide">COPOM/PMSE</p>
            <p className="mt-3 text-base font-bold uppercase">Permutas de Serviço</p>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Período: {dataBR(dataInicio)} a {dataBR(dataFim)} · {situacoes}
            </p>
          </div>

          {permutas.length === 0 ? (
            <p className="text-sm text-center text-slate-500 py-8">Nenhuma permuta para os filtros selecionados.</p>
          ) : (
            <>
              <table className="w-full table-fixed border-collapse text-[10px] leading-tight border border-slate-800">
                <colgroup>
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "27%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "22%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th
                      colSpan={5}
                      className="bg-yellow-300 text-slate-900 text-center text-xs font-bold uppercase py-1 border border-slate-800"
                    >
                      Permutas de {periodoTitulo}
                    </th>
                  </tr>
                  <tr className="text-left font-normal">
                    <th className="px-2 py-1 border border-slate-800 font-normal">GRAD.</th>
                    <th className="px-2 py-1 border border-slate-800 font-normal">MATRÍCULA</th>
                    <th className="px-2 py-1 border border-slate-800 font-normal">NOME</th>
                    <th className="px-2 py-1 border border-slate-800 font-normal">DATA DO SERVIÇO PERMUTADO</th>
                    <th className="px-2 py-1 border border-slate-800 font-normal">DATA DO SERVIÇO PAGO</th>
                  </tr>
                </thead>
                {permutas.map((p) => (
                  <tbody key={p.id_permuta} style={{ breakInside: "avoid" }}>
                    <tr style={{ breakInside: "avoid" }}>
                      <td className="px-2 pt-1 border-x border-slate-800">{p.patente_solicitante || ""}</td>
                      <td className="px-2 pt-1 border-x border-slate-800 whitespace-nowrap">
                        {p.matricula_solicitante}
                      </td>
                      <td className="px-2 pt-1 border-x border-slate-800">
                        {nomeMilitar(p.nome_guerra_solicitante, p.nome_solicitante)}
                      </td>
                      <td className="px-2 pt-1 border-x border-slate-800 whitespace-nowrap">
                        {servico(p.data_solicitante, p.turno_solicitante)}
                      </td>
                      <td className="px-2 pt-1 border-x border-slate-800" />
                    </tr>
                    <tr style={{ breakInside: "avoid" }}>
                      <td className="px-2 pb-1 border-x border-slate-800">{p.patente_alvo || ""}</td>
                      <td className="px-2 pb-1 border-x border-slate-800 whitespace-nowrap">{p.matricula_alvo}</td>
                      <td className="px-2 pb-1 border-x border-slate-800">
                        {nomeMilitar(p.nome_guerra_alvo, p.nome_alvo)}
                      </td>
                      <td className="px-2 pb-1 border-x border-slate-800" />
                      <td className="px-2 pb-1 border-x border-slate-800 whitespace-nowrap underline">
                        {servico(p.data_alvo, p.turno_alvo)}
                      </td>
                    </tr>
                    {incluirDetalhes ? (
                      <tr style={{ breakInside: "avoid" }}>
                        <td
                          colSpan={5}
                          className="px-2 py-1 border border-slate-800 bg-slate-50 text-[9px] text-slate-700"
                        >
                          {detalhesDaPermuta(p).map((linha, i) => (
                            <p key={i} className="break-words">
                              {linha}
                            </p>
                          ))}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={5} className="border-x border-b border-slate-800 p-0" />
                      </tr>
                    )}
                  </tbody>
                ))}
              </table>

              <p className="mt-3 text-[9px] text-slate-500">
                Em cada permuta, a primeira linha é o militar que teve o serviço permutado (solicitante) e a segunda,
                o militar que paga o serviço na data indicada (alvo). T = turno.
              </p>
            </>
          )}

          <div style={{ breakInside: "avoid" }}>{assinaturaJsx}</div>
        </div>
      </div>

      {/* O pagedjs precisa medir elementos de verdade, então o container fica
          fora da tela (e não com display:none) até a hora de imprimir. */}
      <div ref={pagedContainerRef} className="fixed top-0 -left-[10000px] print:static print:left-auto" />
    </>
  );
}
