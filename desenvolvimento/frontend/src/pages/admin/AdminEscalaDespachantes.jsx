import React, { useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, Printer, AlertTriangle, Radio, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import brasaoSergipe from "../../assets/brasao_sergipe_pb.svg";

// ---------------------------------------------------------------------------
// "Escala dos Despachantes" — documento nominal (dia + turno, cada um com
// patente/matrícula/nome de quem está escalado), no MESMO formato do
// boletim mensal oficial do COPOM/PMSE usado como referência ("ESCALA
// MENSAL MÊS DE JULHO/2026 — DESPACHANTES"). Substitui o antigo botão
// "Editar escala do mês" (que não tinha efeito prático de fato — ver
// comentário em AdminEscala.jsx onde o botão era acionado) por algo que
// realmente produz um artefato visível: o documento em si, pronto pra
// imprimir/salvar como PDF.
//
// Paginação via pagedjs (não window.print() puro como o Boletim do
// Efetivo): "página atual/total" real no canto inferior direito só existe
// em CSS Paged Media (@page { @bottom-right { content: counter(page) "/"
// counter(pages) } }) — e o Chrome NÃO implementa esse trecho da spec no
// motor de impressão nativo (é um limite documentado do Chromium, não bug
// nosso). O pagedjs poliflui isso: ele lê o HTML do documento e o CSS já
// carregado pela página, recalcula a paginação ele mesmo em JS e desenha
// cada página + a numeração como elementos DOM normais — af, quando a
// gente chama window.print() depois, o navegador só fotografa o que já
// está pronto, sem precisar entender @page de verdade.
// ---------------------------------------------------------------------------

// "200200000098" -> "2002000000-98" — mesmo padrão do documento oficial.
function formatarMatricula(matricula) {
  if (!matricula) return "";
  const digitos = String(matricula).replace(/\D/g, "");
  if (digitos.length < 3) return String(matricula);
  return `${digitos.slice(0, -2)}-${digitos.slice(-2)}`;
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function primeiroDiaMesAtualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// "2026-07-28" -> Date(2026, 6, 28) local, sem deslocamento de fuso.
function parseDataLocal(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

// "2026-06-28" -> "28 DE JUNHO DE 2026 (DOMINGO)" — cabeçalho de cada bloco
// de dia, igual ao documento oficial.
function formatarCabecalhoDia(dataISO) {
  const data = parseDataLocal(dataISO);
  const dia = String(data.getDate()).padStart(2, "0");
  const nomeMes = data.toLocaleDateString("pt-BR", { month: "long" });
  const diaSemana = data.toLocaleDateString("pt-BR", { weekday: "long" });
  return `${dia} DE ${nomeMes.toUpperCase()} DE ${data.getFullYear()} (${diaSemana.toUpperCase()})`;
}

// Mês de referência do documento = mês do ÚLTIMO dia do intervalo (mesma
// convenção do documento original: o intervalo de exemplo vai de
// 28/06/2026 a 27/07/2026 e o título do boletim é "JULHO/2026", o mês de
// quem fecha o período, não o de quem abre).
function mesReferenciaDoIntervalo(dataFimISO) {
  const data = parseDataLocal(dataFimISO);
  const nomeMes = data.toLocaleDateString("pt-BR", { month: "long" });
  return { nome: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1), ano: data.getFullYear() };
}

function formatarListaMembros(membros) {
  if (!membros || membros.length === 0) return "— sem militares escalados —";
  return membros
    .map((m) => {
      const patente = m.sigla_patente ? `${m.sigla_patente} ` : "";
      const nome = (m.nome_guerra || m.nome || "").toUpperCase();
      return `${patente}${formatarMatricula(m.matricula)} ${nome}`;
    })
    .join(", ");
}

const CHAVE_NOME_RESPONSAVEL = "despachantes_nome_responsavel";
const CHAVE_CARGO_RESPONSAVEL = "despachantes_cargo_responsavel";
const CHAVE_FUNCAO_RESPONSAVEL = "despachantes_funcao_responsavel";

// CSS Paged Media pro pagedjs — página A4, margem com espaço pra numeração,
// e a numeração em si no canto inferior direito ("1/8", sem "Página" na
// frente, só o contador puro).
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
  /* Sem isso, a barra cinza "DESPACHANTES" e a célula da data só aparecem
     impressas se o admin marcar "Gráficos em segundo plano" no diálogo de
     impressão — a maioria não marca, e o fundo simplesmente some. Força a
     impressão da cor de fundo independente dessa opção. */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
`;

export default function AdminEscalaDespachantes() {
  const navigate = useNavigate();
  const location = useLocation();

  // Se veio do botão "Gerar escala por dia de efetivo" na tela de escala,
  // aproveita o período que já estava visível lá como ponto de partida —
  // o admin continua livre pra ajustar as duas datas antes de gerar.
  const [dataInicio, setDataInicio] = useState(
    location.state?.data_inicio || primeiroDiaMesAtualISO(),
  );
  const [dataFim, setDataFim] = useState(location.state?.data_fim || hojeISO());

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [documento, setDocumento] = useState(null); // { periodo, dias }
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // Nome/posto/função de quem assina — editável direto no rodapé do
  // documento (mesma UX do Boletim do Efetivo). Salvo neste navegador
  // (localStorage), pra não precisar redigitar toda vez.
  const [nomeResponsavel, setNomeResponsavel] = useState(
    () => localStorage.getItem(CHAVE_NOME_RESPONSAVEL) || "",
  );
  const [cargoResponsavel, setCargoResponsavel] = useState(
    () => localStorage.getItem(CHAVE_CARGO_RESPONSAVEL) || "",
  );
  const [funcaoResponsavel, setFuncaoResponsavel] = useState(
    () => localStorage.getItem(CHAVE_FUNCAO_RESPONSAVEL) || "Chefe do Copom",
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

  const mesReferencia = documento ? mesReferenciaDoIntervalo(documento.periodo.data_fim) : null;

  // Nome do documento — "Escala dos despachantes {mês}" — usado como
  // título da aba (nome sugerido pro PDF quando o navegador imprime/salva).
  useEffect(() => {
    if (mesReferencia) {
      document.title = `Escala dos despachantes ${mesReferencia.nome} ${mesReferencia.ano}`;
    }
    return () => {
      document.title = "E-scala";
    };
  }, [mesReferencia]);

  // Diferenciador entre downloads — timestamp Unix em milissegundos
  // (Date.now(), a contagem desde 01/01/1970), não uma data formatada.
  // Cada clique em "Imprimir" gera um número diferente, então salvar o
  // mesmo documento duas vezes nunca sobrescreve o arquivo anterior.
  function carimboAgora() {
    // return String(Date.now());
    return String(new Date().getTime());
  }

  // Conteúdo real do documento (o que vira PDF) — o pagedjs lê o HTML
  // daqui, monta as páginas com numeração e devolve pronto pra imprimir.
  const conteudoRef = useRef(null);
  // Onde o pagedjs desenha as páginas já paginadas — só aparece na
  // impressão ("hidden print:block"); em tela, quem aparece é o preview
  // normal acima (conteudoRef).
  const pagedContainerRef = useRef(null);

  async function imprimirPaginado() {
    if (!conteudoRef.current || !pagedContainerRef.current) return;
    setGerandoPdf(true);
    setErro(null);
    const tituloAntes = document.title;
    try {
      if (mesReferencia) {
        document.title = `Escala dos despachantes ${mesReferencia.nome} ${mesReferencia.ano} ${carimboAgora()}`;
      }

      const { Previewer } = await import("pagedjs");

      // Mesmas folhas de estilo que a própria página já carregou (é o CSS
      // do Tailwind compilado) — sem isso o pagedjs reseta os estilos do
      // <link rel="stylesheet"> do documento (ver removeStyles() na lib) e
      // o conteúdo sai sem nenhuma classe aplicada.
      const folhasCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(
        (link) => link.href,
      );

      pagedContainerRef.current.innerHTML = "";

      const previewer = new Previewer();
      await previewer.preview(conteudoRef.current.innerHTML, [...folhasCss, { "escala-despachantes-page-rules": REGRAS_PAGINA }], pagedContainerRef.current);

      window.print();
    } catch {
      setErro("Não foi possível preparar a paginação para impressão. Tente novamente.");
    } finally {
      document.title = tituloAntes;
      setGerandoPdf(false);
    }
  }

  const gerar = useCallback(async () => {
    if (!dataInicio || !dataFim) {
      setErro("Informe a data de início e a data de fim do intervalo.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const { data } = await api.post("/escalas/despachantes/documento", {
        data_inicio: dataInicio,
        data_fim: dataFim,
      });
      setDocumento(data);
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível gerar a escala dos despachantes.");
      setDocumento(null);
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  // Texto pronto da assinatura, calculado do mesmo estado dos campos —
  // espaço reservado enquanto não preenchido, só pra manter a linha do
  // "vai assinar aqui" visível mesmo vazia.
  const linhaAssinatura =
    nomeResponsavel || cargoResponsavel
      ? `${nomeResponsavel}${nomeResponsavel && cargoResponsavel ? " – " : ""}${cargoResponsavel}`
      : " ";
  const linhaFuncao = funcaoResponsavel || " ";

  // Editável igual ao Boletim do Efetivo — clica direto no rodapé do
  // documento e digita. Mas o pagedjs monta as páginas a partir de
  // conteudoRef.current.innerHTML (uma STRING): um <input> controlado pelo
  // React só guarda o valor digitado na propriedade DOM, não no atributo
  // "value" serializado, então esse HTML puro sempre mostraria o campo
  // vazio (ou o placeholder). Por isso ficam DUAS versões lado a lado — os
  // <input> (visíveis só em tela, "print:hidden") pra editar, e o texto
  // simples logo abaixo (invisível em tela, "hidden print:block") que é o
  // que realmente aparece no documento impresso/PDF.
  const assinaturaJsx = (
    <section className="mt-16 pt-6" style={{ breakInside: "avoid" }}>
      <div className="w-80 mx-auto text-center print:hidden mb-1">
        <p className="text-[10px] text-slate-400">Clique nos campos abaixo pra editar</p>
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
            placeholder="Posto (ex: Ten Cel)"
            className="flex-1 min-w-0 text-left bg-transparent border-0 focus:outline-none placeholder:font-normal placeholder:text-slate-400"
          />
        </div>
        <input
          type="text"
          value={funcaoResponsavel}
          onChange={(e) => setFuncaoResponsavel(e.target.value)}
          placeholder="Função (ex: Chefe do Copom)"
          className="w-full text-sm text-center text-slate-700 bg-transparent border-0 focus:outline-none mt-1 placeholder:text-slate-400"
        />
      </div>
      <div className="hidden print:block w-80 mx-auto text-center">
        <p className="text-sm font-bold text-slate-800 border-b border-slate-400 pb-1">
          {linhaAssinatura}
        </p>
        <p className="text-sm text-slate-700 mt-1">{linhaFuncao}</p>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm print:hidden">
        <div className="px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              Escala dos Despachantes
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Grade nominal por dia e turno — mesmo formato do boletim oficial do COPOM/PMSE
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

      {/* Controles — somem na impressão */}
      <div className="max-w-4xl mx-auto p-4 md:p-8 print:hidden">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Início do intervalo
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Fim do intervalo
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={gerar}
            disabled={loading || !dataInicio || !dataFim}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Gerando..." : "Gerar"}
          </button>
          {documento && (
            <button
              onClick={imprimirPaginado}
              disabled={gerandoPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition disabled:opacity-50 ml-auto"
            >
              <Printer size={15} />
              {gerandoPdf ? "Preparando..." : "Imprimir / Gerar PDF"}
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 mb-4">
          O intervalo é livre — inclua os dias do(s) mês(es) anterior(es) que devem entrar no
          documento (ex: 28/06 a 27/07 pra fechar a escala de julho). Dias sem escala gerada no
          ciclo são preenchidos automaticamente ao gerar; ajustes manuais já feitos não são
          alterados.
        </p>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            {erro}
          </div>
        )}
      </div>

      {/* ===================== PREVIEW EM TELA (nunca imprime — quem */}
      {/* imprime é o container paginado abaixo, montado pelo pagedjs) ==== */}
      {documento && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-16 print:hidden">
          <div
            ref={conteudoRef}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-10"
          >
            <div className="text-center mb-6 pb-4 border-b-2 border-slate-800">
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
              <p className="mt-3 text-base font-bold uppercase">
                Escala Mensal Mês de {mesReferencia.nome}/{mesReferencia.ano}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Período: {formatarCabecalhoDia(documento.periodo.data_inicio)} a{" "}
                {formatarCabecalhoDia(documento.periodo.data_fim)}
              </p>
            </div>

            <div className="text-[11px]">
              {/* Bloco por dia em flexbox, não tabela com rowSpan — uma
                  <table> com rowSpan pode ser cortada no meio entre
                  páginas mesmo com "quebra evitada" no contêiner, e a
                  linha que sobra do outro lado do corte fica sem a borda
                  esquerda (a célula da data) nem a de cima. Div com flex
                  respeita "evitar quebra" de forma confiável.

                  Espaçamento entre blocos via margin-BOTTOM em cada um
                  (não "space-y", que usa margin-top no irmão seguinte):
                  margem "no início de um fragmento" (o irmão que abre uma
                  página nova) é zerada pela regra de fragmentação de
                  página do CSS — colava um bloco no outro. margin-bottom
                  no bloco ANTERIOR não sofre disso.

                  O ÚLTIMO dia entra junto com a assinatura num wrapper só
                  com "evitar quebra", pra ela nunca ficar sozinha numa
                  página à parte. */}
              {documento.dias.map((dia, idx) => {
                const ultimo = idx === documento.dias.length - 1;
                const bloco = (
                  <div className="border border-slate-800 overflow-hidden" style={{ breakInside: "avoid" }}>
                    <div className="bg-slate-200 text-center font-bold py-1 border-b border-slate-800 uppercase text-xs">
                      Despachantes
                    </div>
                    <div className="flex">
                      <div className="w-32 flex-shrink-0 flex items-center justify-center text-center font-bold px-2 py-2 border-r border-slate-800 bg-slate-50">
                        {formatarCabecalhoDia(dia.data)}
                      </div>
                      <div className="flex-1 divide-y divide-slate-300">
                        {dia.turnos.map((t) => (
                          <div key={t.turno} className="flex px-2 py-2">
                            <div className="w-20 flex-shrink-0 font-bold">{t.turno}º TURNO:</div>
                            <div className="flex-1">{formatarListaMembros(t.membros)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );

                if (!ultimo) {
                  return (
                    <div key={dia.data} className="mb-4">
                      {bloco}
                    </div>
                  );
                }
                return (
                  <div key={dia.data} style={{ breakInside: "avoid" }}>
                    {bloco}
                    {assinaturaJsx}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== CONTAINER PAGINADO (só aparece na */}
      {/* impressão — é o pagedjs que preenche isso ao clicar em Imprimir) */}
      {/* "fixed" fora da tela, não "hidden" — o pagedjs precisa MEDIR
          elementos de verdade (getBoundingClientRect) pra decidir onde
          quebrar cada página; um contêiner com display:none não tem
          geometria nenhuma (offsetParent vira null) e a paginação quebra
          com esse erro. Fica fora da área visível até a hora de imprimir,
          quando volta ao fluxo normal do documento. */}
      <div
        ref={pagedContainerRef}
        className="fixed top-0 -left-[10000px] print:static print:left-auto"
      />

      {/* Botões flutuantes de navegação vertical — mesmo padrão de
          /admin/escala. Somem na impressão (print:hidden). */}
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
