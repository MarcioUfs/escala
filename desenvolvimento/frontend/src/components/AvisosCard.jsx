import { useCallback, useEffect, useState } from "react";
import { Megaphone, History, Send, Eraser } from "lucide-react";
import api from "../services/api";

const LIMITE_CARACTERES = 2000;

function formatarDataHora(iso) {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", {
    timeZone: "America/Maceio",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Mural de avisos. Todos (usuário e admin) veem o aviso vigente; só o admin
// enxerga o campo de edição e o histórico — a autorização de verdade é do
// backend (POST /admin/avisos exige token de admin), aqui é só o que se
// mostra na tela. O texto é sempre renderizado como texto (nunca HTML).
export default function AvisosCard({ isAdmin = false }) {
  // Usuário e admin usam tokens/segredos diferentes, então a leitura
  // também sai por rotas diferentes.
  const rotaLeitura = isAdmin ? "/admin/avisos" : "/avisos";

  const [aviso, setAviso] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState(null);

  const [rascunho, setRascunho] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [status, setStatus] = useState(null); // { type, message }

  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [historico, setHistorico] = useState(null);
  const [erroHistorico, setErroHistorico] = useState(null);

  const carregarHistorico = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/avisos/historico", { params: { limite: 20 } });
      setHistorico(Array.isArray(data) ? data : []);
      setErroHistorico(null);
    } catch (err) {
      setErroHistorico(err.response?.data?.msg || "Não foi possível carregar o histórico.");
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    async function carregarAviso() {
      try {
        const { data } = await api.get(rotaLeitura);
        if (cancelado) return;
        setAviso(data.aviso || null);
        if (isAdmin) setRascunho(data.aviso?.texto || "");
      } catch (err) {
        if (!cancelado) setErroCarga(err.response?.data?.msg || "Não foi possível carregar os avisos.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregarAviso();
    return () => {
      cancelado = true;
    };
  }, [rotaLeitura, isAdmin]);

  async function publicar(texto) {
    setEnviando(true);
    setStatus(null);
    try {
      const { data } = await api.post("/admin/avisos", { texto });
      setAviso(data.aviso || null);
      setRascunho(data.aviso?.texto || "");
      setStatus({ type: "success", message: data.msg });
      if (mostrarHistorico) await carregarHistorico();
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.msg || "Não foi possível publicar o aviso. Tente novamente.",
      });
    } finally {
      setEnviando(false);
    }
  }

  async function alternarHistorico() {
    const abrir = !mostrarHistorico;
    setMostrarHistorico(abrir);
    if (abrir) await carregarHistorico();
  }

  const textoAtual = aviso?.texto || "";
  const semAlteracao = rascunho.trim() === textoAtual.trim();
  const restante = LIMITE_CARACTERES - rascunho.length;

  return (
    <div className="p-5 sm:p-6 bg-gray-50 border border-gray-200 rounded-xl">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-800">
        <Megaphone size={18} className="text-amber-600" />
        Avisos
      </h2>

      {/* ---------- AVISO VIGENTE (todos veem) ---------- */}
      <div className="mt-3">
        {carregando && <p className="text-sm text-gray-400">Carregando...</p>}
        {erroCarga && <p className="text-sm text-red-600">{erroCarga}</p>}
        {!carregando && !erroCarga && !aviso && (
          <p className="text-sm text-gray-600">Avisos serão colocados aqui</p>
        )}
        {aviso && (
          <div className="bg-white border border-amber-200 border-l-4 border-l-amber-500 rounded-lg p-4">
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{aviso.texto}</p>
            <p className="mt-3 text-xs text-gray-500">
              Publicado por <strong className="text-gray-700">{aviso.nome_admin}</strong> em{" "}
              {formatarDataHora(aviso.created_at)}
            </p>
          </div>
        )}
      </div>

      {/* ---------- EDIÇÃO (somente admin) ---------- */}
      {isAdmin && (
        <div className="mt-5 pt-5 border-t border-gray-200">
          <label htmlFor="texto-aviso" className="block text-sm font-medium text-gray-700 mb-1">
            Escrever ou editar aviso
          </label>
          <textarea
            id="texto-aviso"
            value={rascunho}
            onChange={(e) => {
              setRascunho(e.target.value);
              if (status) setStatus(null);
            }}
            maxLength={LIMITE_CARACTERES}
            rows={5}
            placeholder="Digite o aviso que será exibido no painel de todos os usuários..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>Ao publicar, seu nome e a data/hora ficam registrados no histórico.</span>
            <span className={restante < 100 ? "text-amber-600 font-medium" : ""}>
              {restante} caracteres restantes
            </span>
          </div>

          {status && (
            <div
              role={status.type === "error" ? "alert" : "status"}
              className={`mt-3 p-2.5 rounded text-sm font-medium ${
                status.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {status.message}
            </div>
          )}

          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => publicar(rascunho)}
              disabled={enviando || semAlteracao}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={15} />
              {enviando ? "Publicando..." : "Publicar aviso"}
            </button>
            {aviso && (
              <button
                type="button"
                onClick={() => publicar("")}
                disabled={enviando}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                <Eraser size={15} />
                Retirar aviso
              </button>
            )}
            <button
              type="button"
              onClick={alternarHistorico}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition sm:ml-auto"
            >
              <History size={15} />
              {mostrarHistorico ? "Ocultar histórico" : "Ver histórico"}
            </button>
          </div>

          {mostrarHistorico && (
            <div className="mt-4">
              {erroHistorico && <p className="text-sm text-red-600">{erroHistorico}</p>}
              {!erroHistorico && historico === null && <p className="text-sm text-gray-400">Carregando...</p>}
              {historico && historico.length === 0 && (
                <p className="text-sm text-gray-500">Nenhum aviso foi publicado ainda.</p>
              )}
              {historico && historico.length > 0 && (
                <ul className="max-h-72 overflow-y-auto space-y-2">
                  {historico.map((item) => (
                    <li key={item.id} className="bg-white border border-gray-200 rounded-lg p-3">
                      {item.texto.trim() === "" ? (
                        <p className="text-sm italic text-gray-400">(aviso retirado)</p>
                      ) : (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{item.texto}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        {item.nome_admin} · {formatarDataHora(item.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
