import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, ArrowLeftRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function formatarDataBR(dataISO) {
  if (!dataISO) return "---";
  const [ano, mes, dia] = dataISO.slice(0, 10).split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}

export default function AdminPermutas() {
  const navigate = useNavigate();
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [processando, setProcessando] = useState(false);

  const [modalRejeitar, setModalRejeitar] = useState(null); // { id_permuta }
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);
      const { data } = await api.get("/permutas/admin/pendentes");
      setPendentes(data || []);
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível carregar as solicitações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aprovar = async (id_permuta) => {
    setProcessando(true);
    setErro(null);
    try {
      await api.put(`/permutas/${id_permuta}/aprovar`);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível aprovar a permuta.");
    } finally {
      setProcessando(false);
    }
  };

  const rejeitar = async () => {
    setProcessando(true);
    setErro(null);
    try {
      await api.put(`/permutas/${modalRejeitar.id_permuta}/rejeitar`, {
        motivo_recusa_admin: motivoRejeicao || undefined,
      });
      setModalRejeitar(null);
      setMotivoRejeicao("");
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível rejeitar a permuta.");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              Solicitações de Permuta
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Já confirmadas pelo militar alvo — aguardando sua análise
            </p>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white text-sm font-medium rounded-lg hover:bg-green-900 transition shadow-sm"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-3">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-indigo-600" />
          </div>
        )}

        {!loading && erro && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-center gap-3 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" />
            {erro}
          </div>
        )}

        {!loading && !erro && pendentes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <ArrowLeftRight className="text-slate-300" size={40} />
            <p className="text-slate-500 text-sm max-w-sm">Nenhuma permuta aguardando aprovação no momento.</p>
          </div>
        )}

        {!loading &&
          !erro &&
          pendentes.map((s) => (
            <div key={s.id_permuta} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-mono text-slate-400">Protocolo {s.protocolo}</span>
                <span className="text-[11px] text-slate-400">
                  Solicitado em {new Date(s.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">Solicitante (sai)</p>
                  <p className="font-semibold text-slate-700">
                    {s.nome_guerra_solicitante || s.nome_solicitante}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    {formatarDataBR(s.data_solicitante)} · {s.turno_solicitante}º turno · Grup.{" "}
                    {s.grupamento_solicitante}
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">Alvo (sai)</p>
                  <p className="font-semibold text-slate-700">{s.nome_guerra_alvo || s.nome_alvo}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {formatarDataBR(s.data_alvo)} · {s.turno_alvo}º turno · Grup. {s.grupamento_alvo}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-3">
                <span className="font-semibold text-slate-600">Motivo: </span>
                {s.motivo_solicitacao}
              </p>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => aprovar(s.id_permuta)}
                  disabled={processando}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-md transition"
                >
                  <CheckCircle2 size={13} />
                  Aprovar e incluir na escala
                </button>
                <button
                  onClick={() => {
                    setModalRejeitar({ id_permuta: s.id_permuta });
                    setMotivoRejeicao("");
                  }}
                  disabled={processando}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 disabled:opacity-50 text-xs font-bold rounded-md transition"
                >
                  <XCircle size={13} />
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
      </main>

      {modalRejeitar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setModalRejeitar(null)}
          />
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800">Rejeitar permuta</h3>
              <button
                onClick={() => setModalRejeitar(null)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">Motivo (opcional) — os dois militares serão avisados.</p>
            <textarea
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              rows={3}
              placeholder="Motivo da rejeição..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setModalRejeitar(null)}
                disabled={processando}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={rejeitar}
                disabled={processando}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
              >
                {processando ? "Enviando..." : "Confirmar rejeição"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
