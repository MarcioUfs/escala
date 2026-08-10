// // import { useState, useEffect } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { ArrowBigLeft } from "lucide-react";
// // import api from "../../services/api";

// // export default function AdminListEscalas() {
// //   return (
// //     <div className="p-4 sm:p-8 w-full max-w-full overflow-hidden box-border">
// //       <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-5 sm:p-8">
// //         {/* Cabeçalho */}
// //         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-5 mb-6 gap-4">
// //           <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 break-words">
// //             Lista de Escalas
// //           </h1>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
// import React, { useState, useEffect } from 'react';
// // Lembre-se de importar sua instância de conexão
// import api from "../../services/api";
// import { useNavigate } from 'react-router-dom';

// export default function TelaListarEscalas() {
//   const [escalas, setEscalas] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();
//   const [searchTerm, setSearchTerm] = useState('');

//   // Busca os dados assim que o componente é montado
//   useEffect(() => {
//       const carregarEscalas = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       // Utilizando a rota solicitada para buscar os dados
//       const response = await api.get('/escalas/listar');
      
//       // Assumindo que seu backend retorna um array diretamente ou dentro de um objeto (ex: response.data.escalas)
//       // Adapte 'response.data' conforme o formato exato do seu retorno JSON
//       setEscalas(response.data || []);
      
//     } catch (err) {
//       console.error("Erro ao carregar escalas:", err);
//       setError("Não foi possível comunicar com o servidor para listar as escalas.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//     carregarEscalas();
//   }, []);



//   // Funções de ação (Prontas para você conectar ao seu React Router ou modais)
//   const handleVer = (id) => {
//     console.log("Navegar para visualização da escala:", id);
//     // Ex: navigate(`/admin/escala/${id}`);
//     navigate(`/admin/create-escala`);
//   };

//   const handleEditar = (id) => {
//     console.log("Navegar para edição da escala:", id);
//     // Ex: navigate(`/admin/editar-escala/${id}`);
//     navigate(`/admin/create-escala`);
//   };

//   const handleExcluir = async (id) => {
//     if (window.confirm("Tem certeza que deseja excluir esta escala? Esta ação não pode ser desfeita.")) {
//       try {
//         await api.delete(`/escalas/excluir/${id}`);
//         // Atualiza a lista removendo o item excluído visualmente
//         setEscalas(escalas.filter(escala => escala.id_escala !== id));
//       } catch {
//         alert("Erro ao tentar excluir a escala.");
//       }
//     }
//   };

//   // Filtro de busca local para agilizar a experiência do usuário
//   const escalasFiltradas = escalas.filter(escala => 
//     escala.nome_escala?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     escala.descricao_escala?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // Helper para formatar as datas vindas do PostgreSQL
//   const formatarData = (dataStr) => {
//     if (!dataStr) return '--/--/----';
//     // O timezone offset compensa o horário de Brasília caso necessário
//     const date = new Date(dataStr);
//     return date.toLocaleDateString('pt-BR');
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
//       <div className="max-w-7xl mx-auto space-y-6">
        
//         {/* Cabeçalho de Ações */}
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200 gap-4">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Gerenciar Escalas</h1>
//             <p className="text-sm text-gray-500">Selecione uma escala para visualizar, editar ou remover.</p>
//           </div>
          
//           <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
//             <div className="relative w-full sm:w-64">
//               <input
//                 type="text"
//                 placeholder="Buscar escala..."
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
//               </svg>
//             </div>
            
//             {/* Botão que aponta para a rota de criação construída na etapa anterior */}
//             <button 
//               onClick={() => navigate("/admin/create-escala")}
//               className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
//             >
//               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
//               </svg>
//               Nova Escala
//             </button>
//           </div>
//         </header>

//         {/* Área de Mensagens / Loading */}
//         {error && (
//           <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-md flex items-center">
//             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
//             {error}
//           </div>
//         )}

//         {/* Listagem de Escalas (Responsivo: Grid/Cards no mobile, Tabela no Desktop) */}
//         <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
//           {isLoading ? (
//             <div className="flex justify-center items-center p-12 text-gray-500">
//               <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//               </svg>
//               Carregando escalas...
//             </div>
//           ) : escalasFiltradas.length === 0 ? (
//             <div className="text-center p-12 text-gray-500">
//               Nenhuma escala encontrada.
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200 hidden md:table">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Escala</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {escalasFiltradas.map((escala) => (
//                     <tr key={escala.id_escala || escala.nome_escala} className="hover:bg-gray-50 transition-colors">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-semibold text-gray-900">{escala.nome_escala}</div>
//                         <div className="text-sm text-gray-500 truncate max-w-xs">{escala.descricao_escala}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">{formatarData(escala.data_inicio)} até {formatarData(escala.data_fim)}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${escala.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
//                           {escala.is_active ? 'Ativa' : 'Inativa'}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
//                         <button onClick={() => handleVer(escala.id_escala)} className="text-blue-600 hover:text-blue-900 p-1" title="Ver Grade">
//                           <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
//                         </button>
//                         <button onClick={() => handleEditar(escala.id_escala)} className="text-amber-600 hover:text-amber-900 p-1" title="Editar Informações">
//                           <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
//                         </button>
//                         <button onClick={() => handleExcluir(escala.id_escala)} className="text-red-600 hover:text-red-900 p-1" title="Excluir Escala">
//                           <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>

//               {/* Layout em Cards para Dispositivos Móveis (Escondido em telas md ou maiores) */}
//               <div className="md:hidden flex flex-col divide-y divide-gray-200">
//                 {escalasFiltradas.map((escala) => (
//                   <div key={escala.id_escala || escala.nome_escala} className="p-4 space-y-3 bg-white">
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <h3 className="text-sm font-semibold text-gray-900">{escala.nome_escala}</h3>
//                         <p className="text-xs text-gray-500 mt-1">{escala.descricao_escala}</p>
//                       </div>
//                       <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${escala.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
//                         {escala.is_active ? 'Ativa' : 'Inativa'}
//                       </span>
//                     </div>
                    
//                     <div className="text-xs text-gray-700 flex items-center">
//                       <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
//                       {formatarData(escala.data_inicio)} até {formatarData(escala.data_fim)}
//                     </div>
                    
//                     <div className="flex justify-end space-x-4 border-t pt-2 mt-2">
//                       <button onClick={() => handleVer(escala.id_escala)} className="text-blue-600 text-sm font-medium flex items-center">
//                         Ver
//                       </button>
//                       <button onClick={() => handleEditar(escala.id_escala)} className="text-amber-600 text-sm font-medium flex items-center">
//                         Editar
//                       </button>
//                       <button onClick={() => handleExcluir(escala.id_escala)} className="text-red-600 text-sm font-medium flex items-center">
//                         Excluir
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </section>

//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  X,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

// ---------------------------------------------------------------------------
// TOKENS DE DESIGN
// Sala de operações / rádio-tático: fundo grafite escuro, âmbar como cor de
// ação (referência a luz de alerta de central de operações), fonte mono pra
// dados de grade (data, hora, sigla de grupamento) — evoca painel de
// despacho, não um dashboard SaaS genérico.
// ---------------------------------------------------------------------------
const CORES_GRUPAMENTO = [
  { bg: "bg-amber-500/15", text: "text-amber-300", ring: "ring-amber-500/40", dot: "bg-amber-400" },
  { bg: "bg-sky-500/15", text: "text-sky-300", ring: "ring-sky-500/40", dot: "bg-sky-400" },
  { bg: "bg-emerald-500/15", text: "text-emerald-300", ring: "ring-emerald-500/40", dot: "bg-emerald-400" },
  { bg: "bg-fuchsia-500/15", text: "text-fuchsia-300", ring: "ring-fuchsia-500/40", dot: "bg-fuchsia-400" },
  { bg: "bg-orange-500/15", text: "text-orange-300", ring: "ring-orange-500/40", dot: "bg-orange-400" },
  { bg: "bg-teal-500/15", text: "text-teal-300", ring: "ring-teal-500/40", dot: "bg-teal-400" },
  { bg: "bg-rose-500/15", text: "text-rose-300", ring: "ring-rose-500/40", dot: "bg-rose-400" },
  { bg: "bg-indigo-500/15", text: "text-indigo-300", ring: "ring-indigo-500/40", dot: "bg-indigo-400" },
];

const DIAS_SEMANA_CURTO = ["D", "S", "T", "Q", "Q", "S", "S"];

function corDoGrupamento(sigla, mapaCores) {
  return mapaCores.get(sigla) || CORES_GRUPAMENTO[0];
}

function formatarMesReferencia(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${mm}/${date.getFullYear()}`;
}

function nomeDoMes(date) {
  return date
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Agrupa a lista plana [{data, turno, grupamento, hora_inicio, hora_fim, id_escala}, ...]
// em um mapa por dia: { "2026-07-01": [ {turno:1,...}, {turno:2,...}, {turno:3,...} ] }
function agruparPorDia(escalas) {
  const mapa = new Map();
  for (const linha of escalas) {
    const chave = (linha.data || "").slice(0, 10);
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave).push(linha);
  }
  for (const turnos of mapa.values()) {
    turnos.sort((a, b) => a.turno - b.turno);
  }
  return mapa;
}

// Quebra um intervalo de datas em blocos de 7 dias, começando no domingo da
// semana do primeiro dia, pro calendário mobile ficar alinhado como um
// calendário de verdade (não corta a semana no meio).
function montarSemanas(dataInicio, dataFim) {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  const inicioAjustado = new Date(inicio);
  inicioAjustado.setDate(inicioAjustado.getDate() - inicioAjustado.getDay());

  const semanas = [];
  let cursor = new Date(inicioAjustado);
  while (cursor <= fim) {
    const semana = [];
    for (let i = 0; i < 7; i++) {
      semana.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

function chaveISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DashboardEscala() {
  const navigate = useNavigate();

  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [diasAnteriores] = useState(5); // "os cinco dias anteriores" pedido

  const [escalas, setEscalas] = useState([]);
  const [periodo, setPeriodo] = useState(null); // {data_inicio, data_fim}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [diaSelecionado, setDiaSelecionado] = useState(null); // "yyyy-mm-dd"
  const [turnoEmEdicao, setTurnoEmEdicao] = useState(null); // linha da escala

  const [confirmandoEdicaoMes, setConfirmandoEdicaoMes] = useState(false);
  const [salvandoMes, setSalvandoMes] = useState(false);

  // -------------------------------------------------------------------
  // Carregamento dos dados do período (mês + N dias anteriores)
  // -------------------------------------------------------------------
  const carregarEscalas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post("/escalas/listar/periodo-estendido", {
        mes_referencia: formatarMesReferencia(mesReferencia),
        dias_mes_anterior: diasAnteriores,
      });
      setEscalas(data.escalas || []);
      setPeriodo(data.periodo || null);
    } catch (err) {
      if (err.response?.status === 404) {
        // Período sem nenhuma linha gerada ainda (fn_v2_gerar_escala não
        // rodou pra essas datas) — não é um erro de sistema, é estado vazio.
        setEscalas([]);
        setPeriodo(null);
        setError("empty");
      } else {
        setError("Não foi possível carregar a escala. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }, [mesReferencia, diasAnteriores]);

  useEffect(() => {
    carregarEscalas();
  }, [carregarEscalas]);

  const escalasPorDia = useMemo(() => agruparPorDia(escalas), [escalas]);

  const siglasGrupamento = useMemo(() => {
    const set = new Set(escalas.map((e) => e.grupamento).filter(Boolean));
    return Array.from(set).sort();
  }, [escalas]);

  const mapaCoresGrupamento = useMemo(() => {
    const mapa = new Map();
    siglasGrupamento.forEach((sigla, idx) => {
      mapa.set(sigla, CORES_GRUPAMENTO[idx % CORES_GRUPAMENTO.length]);
    });
    return mapa;
  }, [siglasGrupamento]);

  const diasDoPeriodo = useMemo(() => {
    if (!periodo) return [];
    const inicio = new Date(periodo.data_inicio);
    const fim = new Date(periodo.data_fim);
    const dias = [];
    let cursor = new Date(inicio);
    while (cursor <= fim) {
      dias.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dias;
  }, [periodo]);

  const semanasMobile = useMemo(() => {
    if (!periodo) return [];
    return montarSemanas(periodo.data_inicio, periodo.data_fim);
  }, [periodo]);

  const turnosDoDia = (date) => escalasPorDia.get(chaveISO(date)) || [];

  // -------------------------------------------------------------------
  // Navegação de mês
  // -------------------------------------------------------------------
  const irParaMes = (delta) => {
    setMesReferencia((atual) => {
      const proximo = new Date(atual);
      proximo.setMonth(proximo.getMonth() + delta);
      return proximo;
    });
  };

  // -------------------------------------------------------------------
  // Edição mensal — impacto direto no ciclo inteiro do período visível.
  // Diferente do ajuste manual: regenera a escala a partir da regra do
  // ciclo pra todo o intervalo, não só um dia.
  // -------------------------------------------------------------------
  const confirmarEdicaoMensal = async () => {
    if (!periodo) return;
    try {
      setSalvandoMes(true);
      await api.post("/escalas/gerar", {
        data_inicio: periodo.data_inicio,
        data_fim: periodo.data_fim,
      });
      await carregarEscalas();
      setConfirmandoEdicaoMes(false);
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          "Não foi possível regenerar a escala do mês.",
      );
    } finally {
      setSalvandoMes(false);
    }
  };

  const diaSelecionadoDate = diaSelecionado ? new Date(diaSelecionado) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* CABEÇALHO */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/15 ring-1 ring-amber-500/40 p-2 rounded-lg">
              <Radio className="text-amber-400 size-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                E-Escala
                <span className="text-slate-500 font-normal text-sm">
                  · Gestão de Efetivo
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                Regime de turnos · Ciclo de rotação
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          </div>
        </div>

        {/* Navegação de mês + ação de edição mensal */}
        <div className="px-4 md:px-8 pb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => irParaMes(-1)}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 text-sm font-semibold text-slate-100 font-mono capitalize min-w-[9rem] text-center">
              {nomeDoMes(mesReferencia)}
            </span>
            <button
              onClick={() => irParaMes(1)}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() => setConfirmandoEdicaoMes(true)}
            disabled={!periodo || loading}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-sm font-bold rounded-lg transition"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Editar escala do mês</span>
            <span className="sm:hidden">Editar mês</span>
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-amber-400" />
          </div>
        )}

        {!loading && error && error !== "empty" && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg flex items-center gap-3 text-sm">
            <AlertTriangle size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {!loading && error === "empty" && (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <ShieldCheck className="text-slate-700" size={40} />
            <p className="text-slate-400 text-sm max-w-sm">
              Nenhuma escala gerada para este período ainda. Use "Editar
              escala do mês" para gerar os dias a partir do ciclo.
            </p>
          </div>
        )}

        {!loading && !error && periodo && (
          <>
            {/* ----------------------------------------------------- */}
            {/* DESKTOP — tabela mensal completa (igual ao modelo impresso) */}
            {/* ----------------------------------------------------- */}
            <div className="hidden lg:block">
              <TabelaDesktop
                dias={diasDoPeriodo}
                turnosDoDia={turnosDoDia}
                mapaCoresGrupamento={mapaCoresGrupamento}
                onSelecionarDia={(date) => setDiaSelecionado(chaveISO(date))}
              />
            </div>

            {/* ----------------------------------------------------- */}
            {/* MOBILE / TABLET — calendário quebrado em semanas de 7 dias */}
            {/* ----------------------------------------------------- */}
            <div className="lg:hidden space-y-6">
              {semanasMobile.map((semana, idx) => (
                <CalendarioSemana
                  key={idx}
                  semana={semana}
                  mesReferencia={mesReferencia}
                  turnosDoDia={turnosDoDia}
                  mapaCoresGrupamento={mapaCoresGrupamento}
                  onSelecionarDia={(date) => setDiaSelecionado(chaveISO(date))}
                />
              ))}
            </div>

            {/* Legenda de grupamentos */}
            <div className="mt-6 flex flex-wrap gap-3">
              {siglasGrupamento.map((sigla) => {
                const cor = corDoGrupamento(sigla, mapaCoresGrupamento);
                return (
                  <span
                    key={sigla}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${cor.bg} ${cor.text} ring-1 ${cor.ring}`}
                  >
                    <span className={`size-1.5 rounded-full ${cor.dot}`} />
                    Grupamento {sigla}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* PAINEL DO DIA — turnos + grupamento, com edição por turno */}
      {/* ------------------------------------------------------------- */}
      {diaSelecionadoDate && (
        <PainelDoDia
          data={diaSelecionadoDate}
          turnos={turnosDoDia(diaSelecionadoDate)}
          mapaCoresGrupamento={mapaCoresGrupamento}
          onFechar={() => setDiaSelecionado(null)}
          onEditarTurno={(linha) => setTurnoEmEdicao(linha)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDITOR DE MILITARES DO GRUPAMENTO (por turno selecionado) */}
      {/* ------------------------------------------------------------- */}
      {turnoEmEdicao && (
        <EditorMilitares
          linha={turnoEmEdicao}
          onFechar={() => setTurnoEmEdicao(null)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* CONFIRMAÇÃO — edição mensal (impacto no ciclo inteiro) */}
      {/* ------------------------------------------------------------- */}
      {confirmandoEdicaoMes && (
        <ModalConfirmacao
          titulo="Editar escala do mês"
          descricao="Isso regenera todos os dias do período visível a partir da regra do ciclo. Ajustes manuais feitos em dias específicos dentro desse intervalo serão sobrescritos. Essa ação afeta o mês inteiro, não apenas um dia."
          confirmando={salvandoMes}
          onCancelar={() => setConfirmandoEdicaoMes(false)}
          onConfirmar={confirmarEdicaoMensal}
        />
      )}
    </div>
  );
}

// ===========================================================================
// TABELA DESKTOP
// ===========================================================================
function TabelaDesktop({ dias, turnosDoDia, mapaCoresGrupamento, onSelecionarDia }) {
  const turnosLabel = [
    { numero: 1, label: "1º Turno" },
    { numero: 2, label: "2º Turno" },
    { numero: 3, label: "3º Turno" },
  ];

  return (
    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/50">
      <table className="min-w-full border-collapse font-mono text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-slate-900 border-b border-r border-slate-800 px-3 py-2 text-left text-xs text-slate-500 font-semibold uppercase tracking-wide">
              Turno
            </th>
            {dias.map((dia, idx) => (
              <th
                key={idx}
                className="border-b border-slate-800 px-1 py-2 text-center min-w-[44px]"
              >
                <button
                  onClick={() => onSelecionarDia(dia)}
                  className="w-full flex flex-col items-center gap-0.5 py-1 rounded-md hover:bg-slate-800 transition group"
                >
                  <span className="text-[10px] text-slate-600 group-hover:text-slate-400">
                    {DIAS_SEMANA_CURTO[dia.getDay()]}
                  </span>
                  <span className="text-slate-200 font-bold group-hover:text-amber-300">
                    {dia.getDate()}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {turnosLabel.map((t) => (
            <tr key={t.numero} className="odd:bg-slate-900/30">
              <td className="sticky left-0 bg-slate-900 border-r border-slate-800 px-3 py-2 text-xs text-slate-400 font-semibold whitespace-nowrap">
                {t.label}
              </td>
              {dias.map((dia, idx) => {
                const linha = turnosDoDia(dia).find((l) => l.turno === t.numero);
                const cor = linha
                  ? corDoGrupamento(linha.grupamento, mapaCoresGrupamento)
                  : null;
                return (
                  <td key={idx} className="border-t border-slate-800/60 text-center p-0.5">
                    {linha ? (
                      <button
                        onClick={() => onSelecionarDia(dia)}
                        className={`w-full py-1.5 rounded-md font-bold ${cor.bg} ${cor.text} ring-1 ${cor.ring} hover:brightness-125 transition`}
                        title={`${linha.hora_inicio} às ${linha.hora_fim}${linha.origem === "AJUSTE_MANUAL" ? " · ajuste manual" : ""}`}
                      >
                        {linha.grupamento}
                        {linha.origem === "AJUSTE_MANUAL" && (
                          <span className="ml-0.5 text-[8px] align-top">*</span>
                        )}
                      </button>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-[11px] text-slate-600 border-t border-slate-800">
        * ajuste manual pontual — clique em um dia para ver detalhes
      </p>
    </div>
  );
}

// ===========================================================================
// CALENDÁRIO MOBILE — blocos de 7 dias
// ===========================================================================
function CalendarioSemana({ semana, mesReferencia, turnosDoDia, mapaCoresGrupamento, onSelecionarDia }) {
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
      <div className="grid grid-cols-7 bg-slate-900 border-b border-slate-800">
        {DIAS_SEMANA_CURTO.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-slate-500 py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {semana.map((dia, idx) => {
          const linhas = turnosDoDia(dia);
          const foraDoMes = dia.getMonth() !== mesReferencia.getMonth();
          return (
            <button
              key={idx}
              onClick={() => onSelecionarDia(dia)}
              className={`flex flex-col items-center gap-1 py-2.5 border-t border-r border-slate-800/60 last:border-r-0 transition ${
                foraDoMes ? "opacity-30" : "hover:bg-slate-800"
              }`}
            >
              <span className="text-xs font-mono font-bold text-slate-200">
                {dia.getDate()}
              </span>
              <div className="flex gap-0.5">
                {linhas.slice(0, 3).map((l, i) => {
                  const cor = corDoGrupamento(l.grupamento, mapaCoresGrupamento);
                  return <span key={i} className={`size-1.5 rounded-full ${cor.dot}`} />;
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// PAINEL LATERAL / BOTTOM SHEET — detalhe do dia
// ===========================================================================
function PainelDoDia({ data, turnos, mapaCoresGrupamento, onFechar, onEditarTurno }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onFechar} />
      <div className="relative w-full lg:max-w-md bg-slate-900 border-t lg:border border-slate-800 rounded-t-2xl lg:rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 font-mono uppercase">
              {data.toLocaleDateString("pt-BR", { weekday: "long" })}
            </p>
            <h2 className="text-xl font-bold text-slate-100">
              {data.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {turnos.length === 0 && (
            <p className="text-sm text-slate-500 py-6 text-center">
              Nenhum turno gerado para este dia.
            </p>
          )}
          {turnos.map((linha) => {
            const cor = corDoGrupamento(linha.grupamento, mapaCoresGrupamento);
            return (
              <div
                key={linha.turno}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/50"
              >
                <div>
                  <p className="text-xs text-slate-500 font-mono">
                    {linha.turno}º Turno · {linha.hora_inicio} às {linha.hora_fim}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold ${cor.bg} ${cor.text} ring-1 ${cor.ring}`}
                  >
                    <span className={`size-1.5 rounded-full ${cor.dot}`} />
                    Grupamento {linha.grupamento}
                  </span>
                  {linha.observacao && linha.observacao !== "Sem observação" && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      {linha.observacao}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onEditarTurno(linha)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-xs font-semibold rounded-md transition"
                >
                  <Pencil size={13} />
                  Editar
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// EDITOR DE MILITARES DE UM TURNO/GRUPAMENTO
//
// ATENÇÃO — depende de um endpoint que ainda não existe no backend:
//   GET /escalas/grupamento/:id/membros
// Até esse endpoint ser criado, a lista de militares fica vazia e o
// componente mostra o aviso abaixo em vez de travar a tela.
// A adição de militar usa POST /escalas/grupamento-usuario (já existe),
// mas isso vincula o militar ao grupamento por período — não é uma troca
// pontual só daquele dia. Se a intenção for substituição pontual (só
// aquele plantão), o modelo de dados atual não suporta isso ainda.
// ===========================================================================
function EditorMilitares({ linha, onFechar }) {
  const [membros, setMembros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [endpointIndisponivel, setEndpointIndisponivel] = useState(false);
  const [busca, setBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        // Endpoint alvo — ainda não implementado no backend (ver aviso acima)
        const { data } = await api.get(
          `/escalas/grupamento/${linha.id_grupamento || linha.grupamento}/membros`,
        );
        setMembros(data || []);
      } catch {
        setEndpointIndisponivel(true);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [linha]);

  const buscarMilitares = async (termo) => {
    setBusca(termo);
    if (termo.trim().length < 2) {
      setResultadosBusca([]);
      return;
    }
    try {
      const { data } = await api.get("/admin/allusers");
      const lista = Array.isArray(data) ? data : [];
      const termoLower = termo.toLowerCase();
      setResultadosBusca(
        lista
          .filter(
            (u) =>
              u.nome?.toLowerCase().includes(termoLower) ||
              u.matricula?.includes(termo),
          )
          .slice(0, 6),
      );
    } catch {
      setResultadosBusca([]);
    }
  };

  const adicionarMilitar = async (usuario) => {
    // Checagem local best-effort da regra "não escalar duas vezes no mesmo
    // dia+turno". A validação definitiva precisa vir do backend (constraint
    // de banco), esta é só uma proteção de UX pra evitar o erro óbvio.
    const jaEscaladoNoTurno = membros.some((m) => m.id_user === usuario.id);
    if (jaEscaladoNoTurno) {
      setErro("Este militar já está escalado neste grupamento/turno.");
      return;
    }

    try {
      setErro(null);
      await api.post("/escalas/grupamento-usuario", {
        fk_id_usuario: usuario.id,
        fk_id_grupamento: linha.id_grupamento || linha.grupamento,
        data_inicio: linha.data,
      });
      setMembros((atual) => [...atual, { id_user: usuario.id, nome: usuario.nome }]);
      setBusca("");
      setResultadosBusca([]);
    } catch (err) {
      setErro(
        err.response?.data?.msg ||
          "Não foi possível vincular o militar (verifique se ele já possui vínculo ativo em outro grupamento).",
      );
    }
  };

  const removerMilitar = async (membro) => {
    try {
      setErro(null);
      await api.put(`/escalas/grupamento-usuario/${membro.id_grupamento_usuario}/encerrar`);
      setMembros((atual) => atual.filter((m) => m.id_user !== membro.id_user));
    } catch {
      setErro("Não foi possível remover o militar.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onFechar} />
      <div className="relative w-full lg:max-w-lg bg-slate-900 border-t lg:border border-slate-800 rounded-t-2xl lg:rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 font-mono">
              {linha.turno}º Turno · Grupamento {linha.grupamento}
            </p>
            <h2 className="text-lg font-bold text-slate-100">
              Militares escalados
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {endpointIndisponivel && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex gap-2">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              O backend ainda não expõe a lista de militares por grupamento
              (endpoint <code className="font-mono">GET /escalas/grupamento/:id/membros</code> pendente).
              A busca e o vínculo abaixo já funcionam; a lista atual só não
              carrega os nomes já escalados até esse endpoint existir.
            </span>
          </div>
        )}

        {erro && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
            {erro}
          </div>
        )}

        {/* Lista atual */}
        <div className="space-y-2 mb-5">
          {carregando && (
            <p className="text-sm text-slate-500 py-4 text-center">Carregando...</p>
          )}
          {!carregando && membros.length === 0 && !endpointIndisponivel && (
            <p className="text-sm text-slate-500 py-4 text-center">
              Nenhum militar escalado ainda.
            </p>
          )}
          {membros.map((m) => (
            <div
              key={m.id_user}
              className="flex items-center justify-between px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-lg"
            >
              <span className="text-sm text-slate-200">{m.nome}</span>
              <button
                onClick={() => removerMilitar(m)}
                className="p-1.5 rounded-md hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                aria-label={`Remover ${m.nome}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Busca e adição */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Adicionar militar
          </label>
          <input
            type="text"
            value={busca}
            onChange={(e) => buscarMilitares(e.target.value)}
            placeholder="Buscar por nome ou matrícula..."
            className="mt-1.5 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          {resultadosBusca.length > 0 && (
            <div className="mt-2 border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800">
              {resultadosBusca.map((u) => (
                <button
                  key={u.id}
                  onClick={() => adicionarMilitar(u)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-950/50 hover:bg-slate-800 transition text-left"
                >
                  <span className="text-sm text-slate-200">{u.nome}</span>
                  <Plus size={14} className="text-amber-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// MODAL DE CONFIRMAÇÃO GENÉRICO
// ===========================================================================
function ModalConfirmacao({ titulo, descricao, confirmando, onCancelar, onConfirmar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancelar} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-base font-bold text-slate-100 mb-2">{titulo}</h3>
        <p className="text-sm text-slate-400 mb-5">{descricao}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancelar}
            disabled={confirmando}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={confirmando}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-sm font-bold rounded-lg transition"
          >
            {confirmando ? "Aplicando..." : "Confirmar edição"}
          </button>
        </div>
      </div>
    </div>
  );
}
