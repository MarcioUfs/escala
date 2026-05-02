import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Activity,
  Clock,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Search,
  ArrowLeft,
} from "lucide-react";
import api from "../../services/api";
import { Link, useNavigate } from "react-router-dom";

const DashboardEscalas = () => {
  const [escalas, setEscalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // O Hash do administrador deve ser injetado aqui via Props ou Contexto de Autenticação
  const ADMIN_HASH =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF9hZG1pbiI6MTAwMDAwLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzY4Mjc4NjAsImV4cCI6MTc3Njg0OTQ2MH0.-oRfqvalybLf0DqtAau-shi1rpUP9WNDZHm4cSrP_6A";

  useEffect(() => {
    fetchEscalas();
  }, []);

  const fetchEscalas = async () => {
    try {
      setLoading(true);
      // Chamada para a rota especificada com o Hash no Header para identificação
      const response = await api.get("/escala/listar");
      //   , {
      //     method: 'GET',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'x-admin-hash': ADMIN_HASH, // Identificação do administrador
      //     }
      //   });

      //   if (!response.ok) throw new Error("Erro ao carregar dados do servidor");

      //   const data = await response.json();

      setEscalas(response.data);
    } catch (err) {
      setError(err.message);
      // Fallback para os dados que você enviou caso o backend ainda não responda
      // setEscalas(DADOS_ENVIADOS_NO_PROMPT);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (isoDate) => {
    return new Date(isoDate).toLocaleDateString("pt-BR");
  };

  // Filtro simples para busca (Heurística de Controle e Liberdade do Usuário)
  const escalasFiltradas = escalas.filter((e) =>
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* HEADER DA PÁGINA */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-blue-700" /> E-Escala{" "}
            <span className="text-slate-400 font-light text-lg">
              | Gestão de Efetivo
            </span>
          </h1>
          <p className="text-slate-500 text-sm">
            Monitoramento de ciclos de serviço e guarnições.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input
            type="text"
            placeholder="Buscar escala..."
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 w-full md:w-auto px-6 py-3 bg-green-800 text-white font-medium rounded-lg hover:bg-green-900 transition shadow-sm whitespace-nowrap"
        >
          <ArrowLeft />
          Voltar a gestão
        </button>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* GRID DE ESCALAS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {escalasFiltradas.map((escala) => (
          <div
            key={escala.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all overflow-hidden"
          >
            {/* STATUS E NOME */}
            <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Calendar className="text-white size-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                  {escala.nome}
                </h2>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${escala.status ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
              >
                {escala.status ? "Ativa" : "Inativa"}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* DESCRIÇÃO */}
              <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-slate-200 pl-4">
                {escala.descricao}
              </p>

              {/* METADADOS RÁPIDOS (Match com o mundo real) */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Início / Fim
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Clock size={14} className="text-slate-400" />
                    {formatarData(escala.data_inicio)} -{" "}
                    {formatarData(escala.data_fim)}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Efetivo
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Users size={14} className="text-slate-400" />
                    {escala.efetivo_por_guarnicao} por guarnição
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Rotação
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Activity size={14} className="text-slate-400" />
                    {escala.guarnicoes_do_dia.rotation || "Especial"}
                  </div>
                </div>
              </div>

              {/* ÚLTIMA AÇÃO (Visibilidade do Status do Sistema) */}
              <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between text-xs border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-400 animate-pulse"></div>
                  <span className="text-slate-500">
                    Última ação:{" "}
                    <strong className="text-slate-700">
                      {escala.administrador.historico[0].acao} em{" "}
                      {formatarData(
                        escala.administrador.historico[0].data_acao,
                      )}
                    </strong>
                  </span>
                </div>
                <span className="text-slate-400 italic">
                  por {escala.administrador.historico[0].nome}
                </span>
              </div>
            </div>

            {/* BOTÃO DE AÇÃO */}
            <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => navigate(`/admin/edit-escala`)}
                // onClick={() => navigate(`/admin/edit-escala/${escala.id}`)}
                className="flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800 transition-colors uppercase tracking-widest"
              >
                Gerenciar Ciclos <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardEscalas;
