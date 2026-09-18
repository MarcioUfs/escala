import React, { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  Radio,
  FileText,
  Users,
  UploadCloud,
  FileWarning,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

// Mesmo formato que o export manual da tela de antiguidade do site da PM
// gera — ver diagnóstico do job automático (scraperAntiguidade.js) que
// falha quando o servidor não alcança a intranet da PM. CPF e Data de
// Admissão são opcionais porque o export manual do site não traz essas
// duas colunas (só a API interna usada pelo job automático tem).
const COLUNAS_OBRIGATORIAS = [
  "Nº",
  "Patente",
  "Quadro",
  "Matrícula",
  "Nome",
  "Data de Promoção",
  "Tempo de Promoção",
];
const COLUNAS_OPCIONAIS = ["CPF", "Data de Admissão"];

function validarExtensaoLocal(arquivo) {
  return /\.csv$/i.test(arquivo?.name || "");
}

export default function AdminImportarAntiguidade() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [arquivo, setArquivo] = useState(null);
  const [arrastando, setArrastando] = useState(false);
  const [erroArquivo, setErroArquivo] = useState(null);

  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // { totalRegistros }
  const [erroEnvio, setErroEnvio] = useState(null);
  const [errosValidacao, setErrosValidacao] = useState(null); // array de strings

  function escolherArquivo(novoArquivo) {
    setResultado(null);
    setErroEnvio(null);
    setErrosValidacao(null);

    if (!novoArquivo) {
      setArquivo(null);
      setErroArquivo(null);
      return;
    }

    if (!validarExtensaoLocal(novoArquivo)) {
      setArquivo(null);
      setErroArquivo("Apenas arquivos .csv são aceitos. Esse arquivo não tem a extensão .csv.");
      return;
    }

    if (novoArquivo.size > TAMANHO_MAXIMO_BYTES) {
      setArquivo(null);
      setErroArquivo("Arquivo maior que o limite permitido de 5MB.");
      return;
    }

    setErroArquivo(null);
    setArquivo(novoArquivo);
  }

  function aoSoltarArquivo(e) {
    e.preventDefault();
    setArrastando(false);
    const novoArquivo = e.dataTransfer.files?.[0] || null;
    escolherArquivo(novoArquivo);
  }

  function limparSelecao() {
    setArquivo(null);
    setErroArquivo(null);
    setResultado(null);
    setErroEnvio(null);
    setErrosValidacao(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function enviarArquivo() {
    if (!arquivo) return;

    setEnviando(true);
    setResultado(null);
    setErroEnvio(null);
    setErrosValidacao(null);

    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      const { data } = await api.post("/admin/antiguidade/importar-csv", formData);
      setResultado({ totalRegistros: data.totalRegistros });
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      const dados = err.response?.data;
      if (Array.isArray(dados?.erros) && dados.erros.length > 0) {
        setErrosValidacao(dados.erros);
      }
      setErroEnvio(dados?.msg || "Não foi possível importar o arquivo. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              Importar Antiguidade (CSV)
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Alternativa manual ao job automático — use quando o sistema não conseguir buscar os dados direto do site da PM
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
              className="flex items-center gap-2 px-4 py-2 bg-orange-700 text-white text-sm font-medium rounded-lg hover:bg-orange-800 transition shadow-sm"
            >
              <Users size={16} />
              <span className="hidden sm:inline">Afastamentos</span>
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

      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-4">
        {/* Instruções de formato */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-2">Formato aceito</h2>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            <li>
              <strong>Somente arquivos .csv</strong> — qualquer outro formato (.xlsx, .xls, .txt, .pdf etc.) será
              rejeitado, mesmo que o conteúdo pareça igual.
            </li>
            <li>
              Deve ser exatamente o CSV exportado pela tela de antiguidade do site da PM: separado por{" "}
              <code className="bg-slate-100 px-1 rounded">;</code>, campos entre aspas, codificação UTF-8.
            </li>
            <li>
              Colunas obrigatórias (nessa grafia, em qualquer ordem):{" "}
              {COLUNAS_OBRIGATORIAS.map((c, i) => (
                <span key={c}>
                  <code className="bg-slate-100 px-1 rounded">{c}</code>
                  {i < COLUNAS_OBRIGATORIAS.length - 1 ? ", " : ""}
                </span>
              ))}
              .
            </li>
            <li>
              Colunas opcionais (se o arquivo tiver essas informações):{" "}
              {COLUNAS_OPCIONAIS.map((c, i) => (
                <span key={c}>
                  <code className="bg-slate-100 px-1 rounded">{c}</code>
                  {i < COLUNAS_OPCIONAIS.length - 1 ? ", " : ""}
                </span>
              ))}
              .
            </li>
            <li>Nenhuma outra coluna é aceita — um arquivo com colunas a mais ou a menos é rejeitado inteiro.</li>
            <li>
              Se qualquer linha do arquivo estiver com dado inválido, <strong>nada é importado</strong> — corrija e
              reenvie o arquivo completo.
            </li>
          </ul>
        </div>

        {/* Área de upload */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Arquivo</h2>

          {!arquivo && (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setArrastando(true);
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={aoSoltarArquivo}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-10 px-4 cursor-pointer transition ${
                arrastando ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
              }`}
            >
              <UploadCloud size={28} className="text-slate-400" />
              <p className="text-sm text-slate-600 text-center">
                Clique para selecionar ou arraste o arquivo <strong>.csv</strong> aqui
              </p>
              <p className="text-[11px] text-slate-400">Tamanho máximo: 5MB</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => escolherArquivo(e.target.files?.[0] || null)}
              />
            </label>
          )}

          {arquivo && (
            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={18} className="text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{arquivo.name}</p>
                  <p className="text-[11px] text-slate-400">{(arquivo.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={limparSelecao}
                title="Remover"
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {erroArquivo && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <FileWarning size={15} className="mt-0.5 flex-shrink-0" />
              {erroArquivo}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={enviarArquivo}
              disabled={!arquivo || enviando}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud size={15} />
              {enviando ? "Importando..." : "Importar"}
            </button>
          </div>
        </div>

        {/* Resultado: sucesso */}
        {resultado && (
          <div className="bg-white border border-emerald-200 rounded-xl shadow-sm p-5 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">Importação concluída com sucesso.</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {resultado.totalRegistros} {resultado.totalRegistros === 1 ? "registro" : "registros"} importado(s)/atualizado(s).
              </p>
              <button
                type="button"
                onClick={limparSelecao}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition"
              >
                <RotateCcw size={13} />
                Importar outro arquivo
              </button>
            </div>
          </div>
        )}

        {/* Resultado: erro genérico */}
        {erroEnvio && !errosValidacao && (
          <div className="bg-white border border-red-200 rounded-xl shadow-sm p-5 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{erroEnvio}</p>
          </div>
        )}

        {/* Resultado: erros de validação linha a linha */}
        {errosValidacao && (
          <div className="bg-white border border-red-200 rounded-xl shadow-sm p-5">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">{erroEnvio}</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Nenhum dado foi importado. Corrija os itens abaixo no arquivo e envie novamente.
                </p>
              </div>
            </div>
            <ul className="max-h-64 overflow-y-auto text-xs text-red-700 space-y-1 bg-red-50 border border-red-100 rounded-lg p-3 list-disc pl-6">
              {errosValidacao.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Voltar ao topo"
          aria-label="Voltar ao topo"
          className="flex items-center justify-center size-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition"
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </div>
  );
}
