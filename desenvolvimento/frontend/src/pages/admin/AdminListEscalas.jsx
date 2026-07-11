// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { ArrowBigLeft } from "lucide-react";
// import api from "../../services/api";

// export default function AdminListEscalas() {
//   return (
//     <div className="p-4 sm:p-8 w-full max-w-full overflow-hidden box-border">
//       <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-5 sm:p-8">
//         {/* Cabeçalho */}
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-5 mb-6 gap-4">
//           <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 break-words">
//             Lista de Escalas
//           </h1>
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useState, useEffect } from 'react';
// Lembre-se de importar sua instância de conexão
import api from "../../services/api";

export default function TelaListarEscalas() {
  const [escalas, setEscalas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Busca os dados assim que o componente é montado
  useEffect(() => {
    carregarEscalas();
  }, []);

  const carregarEscalas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Utilizando a rota solicitada para buscar os dados
      const response = await api.get('/escalas/listar');
      
      // Assumindo que seu backend retorna um array diretamente ou dentro de um objeto (ex: response.data.escalas)
      // Adapte 'response.data' conforme o formato exato do seu retorno JSON
      setEscalas(response.data || []);
      
    } catch (err) {
      console.error("Erro ao carregar escalas:", err);
      setError("Não foi possível comunicar com o servidor para listar as escalas.");
    } finally {
      setIsLoading(false);
    }
  };

  // Funções de ação (Prontas para você conectar ao seu React Router ou modais)
  const handleVer = (id) => {
    console.log("Navegar para visualização da escala:", id);
    // Ex: navigate(`/admin/escala/${id}`);
  };

  const handleEditar = (id) => {
    console.log("Navegar para edição da escala:", id);
    // Ex: navigate(`/admin/editar-escala/${id}`);
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta escala? Esta ação não pode ser desfeita.")) {
      try {
        await api.delete(`/escala/excluir/${id}`);
        // Atualiza a lista removendo o item excluído visualmente
        setEscalas(escalas.filter(escala => escala.id_escala !== id));
      } catch (err) {
        alert("Erro ao tentar excluir a escala.");
      }
    }
  };

  // Filtro de busca local para agilizar a experiência do usuário
  const escalasFiltradas = escalas.filter(escala => 
    escala.nome_escala?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    escala.descricao_escala?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper para formatar as datas vindas do PostgreSQL
  const formatarData = (dataStr) => {
    if (!dataStr) return '--/--/----';
    // O timezone offset compensa o horário de Brasília caso necessário
    const date = new Date(dataStr);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabeçalho de Ações */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Escalas</h1>
            <p className="text-sm text-gray-500">Selecione uma escala para visualizar, editar ou remover.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar escala..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            
            {/* Botão que aponta para a rota de criação construída na etapa anterior */}
            <a 
              href="/admin/criar-escala" 
              className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Nova Escala
            </a>
          </div>
        </header>

        {/* Área de Mensagens / Loading */}
        {error && (
          <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-md flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {error}
          </div>
        )}

        {/* Listagem de Escalas (Responsivo: Grid/Cards no mobile, Tabela no Desktop) */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          {isLoading ? (
            <div className="flex justify-center items-center p-12 text-gray-500">
              <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Carregando escalas...
            </div>
          ) : escalasFiltradas.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              Nenhuma escala encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 hidden md:table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Escala</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {escalasFiltradas.map((escala) => (
                    <tr key={escala.id_escala || escala.nome_escala} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{escala.nome_escala}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{escala.descricao_escala}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatarData(escala.data_inicio)} até {formatarData(escala.data_fim)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${escala.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {escala.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => handleVer(escala.id_escala)} className="text-blue-600 hover:text-blue-900 p-1" title="Ver Grade">
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                        <button onClick={() => handleEditar(escala.id_escala)} className="text-amber-600 hover:text-amber-900 p-1" title="Editar Informações">
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onClick={() => handleExcluir(escala.id_escala)} className="text-red-600 hover:text-red-900 p-1" title="Excluir Escala">
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Layout em Cards para Dispositivos Móveis (Escondido em telas md ou maiores) */}
              <div className="md:hidden flex flex-col divide-y divide-gray-200">
                {escalasFiltradas.map((escala) => (
                  <div key={escala.id_escala || escala.nome_escala} className="p-4 space-y-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{escala.nome_escala}</h3>
                        <p className="text-xs text-gray-500 mt-1">{escala.descricao_escala}</p>
                      </div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${escala.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {escala.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {formatarData(escala.data_inicio)} até {formatarData(escala.data_fim)}
                    </div>
                    
                    <div className="flex justify-end space-x-4 border-t pt-2 mt-2">
                      <button onClick={() => handleVer(escala.id_escala)} className="text-blue-600 text-sm font-medium flex items-center">
                        Ver
                      </button>
                      <button onClick={() => handleEditar(escala.id_escala)} className="text-amber-600 text-sm font-medium flex items-center">
                        Editar
                      </button>
                      <button onClick={() => handleExcluir(escala.id_escala)} className="text-red-600 text-sm font-medium flex items-center">
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}