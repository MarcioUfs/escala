import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function formatarDataBR(dataISO) {
  if (!dataISO) return "---";
  const [ano, mes, dia] = dataISO.slice(0, 10).split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}

const STATUS_INFO = {
  AGUARDANDO_ALVO: { label: "Aguardando confirmação", cor: "bg-amber-100 text-amber-700 ring-amber-300", icone: Clock },
  RECUSADA_ALVO: { label: "Recusada pelo alvo", cor: "bg-red-100 text-red-700 ring-red-300", icone: XCircle },
  AGUARDANDO_ADMIN: { label: "Aguardando o admin", cor: "bg-sky-100 text-sky-700 ring-sky-300", icone: Clock },
  APROVADA: { label: "Aprovada", cor: "bg-emerald-100 text-emerald-700 ring-emerald-300", icone: CheckCircle2 },
  RECUSADA_ADMIN: { label: "Rejeitada pelo admin", cor: "bg-red-100 text-red-700 ring-red-300", icone: XCircle },
};

export default function UserPermutas() {
  const navigate = useNavigate();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [modalRecusar, setModalRecusar] = useState(null); // { id_permuta }
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erroAcao, setErroAcao] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);
      const { data } = await api.get("/permutas/minhas");
      setSolicitacoes(data || []);
    } catch (err) {
      setErro(err.response?.data?.msg || "Não foi possível carregar suas permutas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const marcarLida = async (id_permuta) => {
    try {
      await api.put(`/permutas/${id_permuta}/marcar-lida`);
      setSolicitacoes((atual) =>
        atual.map((s) => (s.id_permuta === id_permuta ? { ...s, _marcandoLida: true } : s)),
      );
    } catch {
      // silencioso — não é crítico, o badge só fica desatualizado até o próximo carregar()
    }
  };

  const confirmar = async (id_permuta) => {
    setProcessando(true);
    setErroAcao(null);
    try {
      await api.put(`/permutas/${id_permuta}/confirmar`);
      await carregar();
    } catch (err) {
      setErroAcao(err.response?.data?.msg || "Não foi possível confirmar a permuta.");
    } finally {
      setProcessando(false);
    }
  };

  const recusar = async () => {
    if (motivoRecusa.trim().length < 5) return;
    setProcessando(true);
    setErroAcao(null);
    try {
      await api.put(`/permutas/${modalRecusar.id_permuta}/recusar`, {
        motivo_recusa: motivoRecusa,
      });
      setModalRecusar(null);
      setMotivoRecusa("");
      await carregar();
    } catch (err) {
      setErroAcao(err.response?.data?.msg || "Não foi possível recusar a permuta.");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Minhas Permutas</h1>
            <p className="text-xs text-slate-500 font-mono">Solicitações enviadas e recebidas</p>
          </div>
          <button
            onClick={() => navigate("/user")}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition shadow-sm"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-3">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-emerald-600" />
          </div>
        )}

        {!loading && erro && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-center gap-3 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" />
            {erro}
          </div>
        )}

        {!loading && !erro && solicitacoes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <ArrowLeftRight className="text-slate-300" size={40} />
            <p className="text-slate-500 text-sm max-w-sm">
              Nenhuma solicitação de permuta ainda. Acesse a Escala de Serviço e clique em "Permutar com" num
              militar escalado.
            </p>
          </div>
        )}

        {!loading &&
          !erro &&
          solicitacoes.map((s) => {
            const info = STATUS_INFO[s.status] || STATUS_INFO.AGUARDANDO_ALVO;
            const Icone = info.icone;
            const souAlvo = s.meu_papel === "ALVO";
            const precisaAcao = souAlvo && s.status === "AGUARDANDO_ALVO";
            const naoLida =
              (souAlvo ? !s.lido_alvo : !s.lido_solicitante) &&
              ["APROVADA", "RECUSADA_ADMIN", "RECUSADA_ALVO"].includes(s.status) &&
              !s._marcandoLida;

            return (
              <div
                key={s.id_permuta}
                className={`p-4 bg-white border rounded-xl shadow-sm ${
                  naoLida ? "border-indigo-300 ring-1 ring-indigo-100" : "border-slate-200"
                }`}
                onClick={() => naoLida && marcarLida(s.id_permuta)}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono text-slate-400">Protocolo {s.protocolo}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${info.cor}`}
                  >
                    <Icone size={12} />
                    {info.label}
                    {naoLida && <span className="ml-1 size-1.5 rounded-full bg-indigo-500" />}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">
                      {souAlvo ? "Solicitante" : "Você"}
                    </p>
                    <p className="font-semibold text-slate-700">
                      {s.nome_guerra_solicitante || s.nome_solicitante}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      {formatarDataBR(s.data_solicitante)} · {s.turno_solicitante}º turno · Grup.{" "}
                      {s.grupamento_solicitante}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">
                      {souAlvo ? "Você" : "Alvo"}
                    </p>
                    <p className="font-semibold text-slate-700">{s.nome_guerra_alvo || s.nome_alvo}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {formatarDataBR(s.data_alvo)} · {s.turno_alvo}º turno · Grup. {s.grupamento_alvo}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-slate-600">Motivo: </span>
                  {s.motivo_solicitacao}
                </p>

                {s.motivo_recusa_alvo && (
                  <p className="text-xs text-red-600 mb-1">
                    <span className="font-semibold">Motivo da recusa: </span>
                    {s.motivo_recusa_alvo}
                  </p>
                )}
                {s.motivo_recusa_admin && (
                  <p className="text-xs text-red-600 mb-1">
                    <span className="font-semibold">Motivo da rejeição (admin): </span>
                    {s.motivo_recusa_admin}
                  </p>
                )}

                {precisaAcao && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmar(s.id_permuta);
                      }}
                      disabled={processando}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-md transition"
                    >
                      <CheckCircle2 size={13} />
                      Confirmar e enviar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalRecusar({ id_permuta: s.id_permuta });
                        setErroAcao(null);
                      }}
                      disabled={processando}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 disabled:opacity-50 text-xs font-bold rounded-md transition"
                    >
                      <XCircle size={13} />
                      Recusar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </main>

      {modalRecusar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setModalRecusar(null);
              setMotivoRecusa("");
            }}
          />
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800">Recusar permuta</h3>
              <button
                onClick={() => {
                  setModalRecusar(null);
                  setMotivoRecusa("");
                }}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Explique por que os dados estão incorretos ou por que você não pode aceitar essa permuta.
            </p>
            {erroAcao && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {erroAcao}
              </div>
            )}
            <textarea
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
              rows={3}
              placeholder="Motivo da recusa..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setModalRecusar(null);
                  setMotivoRecusa("");
                }}
                disabled={processando}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={recusar}
                disabled={motivoRecusa.trim().length < 5 || processando}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-bold rounded-lg transition"
              >
                {processando ? "Enviando..." : "Confirmar recusa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
