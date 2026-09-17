import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

function formatarTempo(segundosTotais) {
  const minutos = Math.floor(segundosTotais / 60);
  const segundos = segundosTotais % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

// Aviso global de "limite de requisições atingido" — escuta o evento
// "api:rate-limited" disparado pelo interceptor de resposta em services/api.js
// sempre que qualquer chamada voltar com 429, não importa em qual tela o
// admin estiver. Fica montado uma vez em App.jsx, fora das rotas.
//
// De propósito NÃO mostra quantas requisições levam ao bloqueio (só o tempo
// de espera) — só o "Ciente!" fecha o aviso; clicar fora não fecha, pra
// garantir que o admin realmente viu o recado antes de continuar.
export default function RateLimitModal() {
  const [segundosRestantes, setSegundosRestantes] = useState(null);
  const intervaloRef = useRef(null);

  useEffect(() => {
    function aoReceberBloqueio(evento) {
      const total = Math.max(0, Math.round(evento.detail?.retryAfterSeconds || 0));
      setSegundosRestantes(total);
    }
    window.addEventListener("api:rate-limited", aoReceberBloqueio);
    return () => window.removeEventListener("api:rate-limited", aoReceberBloqueio);
  }, []);

  const modalAberto = segundosRestantes !== null;

  useEffect(() => {
    if (!modalAberto) return undefined;

    intervaloRef.current = setInterval(() => {
      setSegundosRestantes((s) => (s === null ? null : Math.max(0, s - 1)));
    }, 1000);

    return () => clearInterval(intervaloRef.current);
  }, [modalAberto]);

  if (!modalAberto) return null;

  const aguardando = segundosRestantes > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-center">
        <div className="mx-auto mb-3 flex items-center justify-center size-12 rounded-full bg-red-100">
          <AlertTriangle className="text-red-600" size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-2">Muitas solicitações</h3>
        <p className="text-sm text-slate-500 mb-4">
          Você fez muitas solicitações em pouco tempo. Aguarde para continuar usando o sistema.
        </p>

        <div className="mb-5 py-3 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-1">
            {aguardando ? "Tempo restante" : "Você já pode continuar"}
          </p>
          <p className={`text-2xl font-mono font-bold ${aguardando ? "text-red-600" : "text-emerald-600"}`}>
            {formatarTempo(segundosRestantes)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSegundosRestantes(null)}
          className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition"
        >
          Ciente!
        </button>
      </div>
    </div>
  );
}
