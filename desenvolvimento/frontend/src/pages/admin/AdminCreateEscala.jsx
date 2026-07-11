// import React, { useState } from 'react';

// export default function TelaGerenciamentoEscala() {
//   // Estados do formulário de criação
//   const [formData, setFormData] = useState({
//     nome: '',
//     descricao: '',
//     data_inicio: '',
//     data_fim: ''
//   });
  
//   // Estados de feedback e UI
//   const [status, setStatus] = useState({ type: '', msg: '' });
//   const [isLoading, setIsLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');

//   // Simulação de dados estáticos baseados no modelo em PDF para renderização da grade
//   const turnos = ['1º TURNO- 07h as 15h', '2º TURNO- 15h as 23h', '3º TURNO- 23h as 07h'];
//   const diasMes = Array.from({ length: 31 }, (_, i) => i + 1);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setStatus({ type: '', msg: '' });

//     try {
//       // Alterado para POST pois o backend recebe os parâmetros no req.body
//       const response = await fetch('/admin/criar-escala', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       });

//       const data = await response.json();

//       if (response.ok || response.status === 201) {
//         setStatus({ type: 'success', msg: data.msg || 'Modelo de escala criado com sucesso!' });
//         setFormData({ nome: '', descricao: '', data_inicio: '', data_fim: '' });
//       } else {
//         // Trata os erros 400 e 409 mapeados no seu backend
//         setStatus({ type: 'error', msg: data.msg || 'Erro ao processar a solicitação.' });
//       }
//     } catch (error) {
//       setStatus({ type: 'error', msg: 'Erro de conexão com o servidor. Verifique a rede. '+ error.message });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
//       <div className="max-w-7xl mx-auto space-y-6">
        
//         {/* Cabeçalho */}
//         <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">E-Escala | Gerenciamento</h1>
//             <p className="text-sm text-gray-500">Centro Integrado de Operações de Segurança Pública</p>
//           </div>
//           <div className="mt-4 md:mt-0 relative w-full md:w-72">
//             <input
//               type="text"
//               placeholder="Buscar militares ou escalas..."
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
//             </svg>
//           </div>
//         </header>

//         {/* Formulário de Criação de Escala */}
//         <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
//           <h2 className="text-lg font-semibold border-b pb-2 mb-4">Nova Escala Base</h2>
          
//           {status.msg && (
//             <div className={`p-4 mb-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
//               {status.msg}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="space-y-1">
//               <label className="text-sm font-medium text-gray-700">Nome da Escala *</label>
//               <input
//                 type="text"
//                 name="nome"
//                 required
//                 value={formData.nome}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder="Ex: Escala Dez/Jan"
//               />
//             </div>
            
//             <div className="space-y-1 lg:col-span-1">
//               <label className="text-sm font-medium text-gray-700">Descrição</label>
//               <input
//                 type="text"
//                 name="descricao"
//                 value={formData.descricao}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder="Detalhes opcionais..."
//               />
//             </div>

//             <div className="space-y-1">
//               <label className="text-sm font-medium text-gray-700">Data Início *</label>
//               <input
//                 type="date"
//                 name="data_inicio"
//                 required
//                 value={formData.data_inicio}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div className="space-y-1">
//               <label className="text-sm font-medium text-gray-700">Data Fim *</label>
//               <input
//                 type="date"
//                 name="data_fim"
//                 required
//                 value={formData.data_fim}
//                 onChange={handleInputChange}
//                 className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div className="lg:col-span-4 flex justify-end mt-2">
//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className={`px-6 py-2 rounded-md text-white font-medium flex items-center transition-colors ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
//               >
//                 {isLoading ? 'Processando...' : (
//                   <>
//                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
//                     Gerar Modelo
//                   </>
//                 )}
//               </button>
//             </div>
//           </form>
//         </section>

//         {/* Visualização da Grade da Escala (Layout inspirado no PDF) */}
//         <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-lg font-semibold">Distribuição de Guarnições</h2>
//             <button className="text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3 py-1 rounded">
//               Editar Grade Ativa
//             </button>
//           </div>
          
//           <div className="overflow-x-auto">
//             <table className="min-w-full border-collapse text-center text-sm">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th className="border border-gray-300 p-2 text-left w-48 sticky left-0 bg-gray-100 z-10">Dias do Mês</th>
//                   {diasMes.map(dia => (
//                     <th key={dia} className="border border-gray-300 p-2 min-w-[40px]">{dia}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {turnos.map((turno, index) => (
//                   <tr key={index} className="hover:bg-gray-50 transition-colors">
//                     <td className="border border-gray-300 p-2 text-left font-medium text-xs sticky left-0 bg-white z-10">{turno}</td>
//                     {diasMes.map(dia => (
//                       <td key={dia} className="border border-gray-300 p-2 cursor-pointer hover:bg-blue-50 text-gray-700 font-semibold">
//                         {/* Simulação: as letras seriam preenchidas dinamicamente pelo DB */}
//                         {['A', 'B', 'C', 'D', 'E', 'F'][(dia + index) % 6]}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         {/* Painel de Efetivo / Despachantes */}
//         <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
//           <h2 className="text-lg font-semibold mb-4">Efetivo por Guarnição (Despachantes)</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
//             {/* Componente base para renderizar os cartões das guarnições */}
//             {['A', 'B', 'C', 'D', 'E', 'F'].map((guarnicao) => (
//               <div key={guarnicao} className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow">
//                 <div className="flex justify-between items-center border-b pb-2 mb-2">
//                   <h3 className="font-bold text-blue-800 text-lg">Equipe {guarnicao}</h3>
//                   <div className="flex space-x-2">
//                     <button className="text-gray-400 hover:text-blue-600" title="Adicionar Militar">
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
//                     </button>
//                   </div>
//                 </div>
//                 <ul className="space-y-2 text-sm text-gray-600 max-h-40 overflow-y-auto pr-2">
//                   <li className="flex justify-between items-center group">
//                     <span>3° SGT FULANO (Exemplo)</span>
//                     <button className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity" title="Substituir/Remover">
//                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
//                     </button>
//                   </li>
//                   <li className="flex justify-between items-center group">
//                     <span>CB CICLANO (Exemplo)</span>
//                     <button className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity" title="Substituir/Remover">
//                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
//                     </button>
//                   </li>
//                 </ul>
//               </div>
//             ))}
//           </div>
//         </section>

//       </div>
//     </div>
//   );
// }

import React, { useState } from 'react';
import api from "../../services/api";

export default function TelaGerenciamentoEscala() {
  // Estado atualizado para contemplar todos os campos solicitados
  const [formData, setFormData] = useState({
    nome_escala: '',
    descricao_escala: '',
    data_inicio: '',
    data_fim: '',
    fk_id_guarnicao: null, // Padrão null conforme o backend
    fk_id_admin: '',       // Será preenchido via auth (login por CPF) no backend ou aqui se necessário
    fk_id_setor: ''        // Pode ser omitido se o req.user.fk_id_setor assumir o controle no backend
  });
  
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const turnos = ['1º TURNO- 07h as 15h', '2º TURNO- 15h as 23h', '3º TURNO- 23h as 07h'];
  const diasMes = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', msg: '' });

    // Preparando o payload. Enviamos tanto os nomes solicitados na diretriz (nome_escala) 
    // quanto os nomes que o seu código backend lê no req.body (req.body.nome).
    const payload = {
      nome_escala: formData.nome_escala,
      descricao_escala: formData.descricao_escala,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim,
      fk_id_setor: 3000 // Se não fornecido, envia null
    //   fk_id_setor: formData.fk_id_setor ? formData.fk_id_setor : 3000 // Se não fornecido, envia null
    };

 try {
      // Usando a sua instância configurada (certifique-se de ter feito o import, ex: import api from '../services/api';)
      const response = await api.post('/escala/criar-escala', payload);

      // Se passou pelo await sem cair no catch, é sucesso (status 200, 201)
      setStatus({ 
        type: 'success', 
        msg: response.data.msg || 'Modelo de escala criado com sucesso!' 
      });
      
      // Limpa o formulário após sucesso
      setFormData(prev => ({
        ...prev,
        nome_escala: '',
        descricao_escala: '',
        data_inicio: '',
        data_fim: ''
      }));

    } catch (error) {
      console.error("Erro na requisição:", error);
      
      // Verifica se o erro veio com uma resposta do backend (ex: 400 ou 409 mapeados no seu Node)
      if (error.response && error.response.data) {
        setStatus({ 
          type: 'error', 
          msg: error.response.data.msg || 'Erro ao criar escala. Verifique os dados.' 
        });
      } else {
        // Erro de rede ou servidor fora do ar
        setStatus({ 
          type: 'error', 
          msg: 'Erro de comunicação com o servidor. Verifique se o backend está rodando.' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">E-Escala | Gerenciamento</h1>
            <p className="text-sm text-gray-500">Centro Integrado de Operações de Segurança Pública</p>
          </div>
          <div className="mt-4 md:mt-0 relative w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar militares ou escalas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </header>

        {/* Formulário de Criação de Escala */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Nova Escala Base</h2>
          
          {status.msg && (
            <div className={`p-4 mb-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {status.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nome da Escala *</label>
              <input
                type="text"
                name="nome_escala"
                required
                value={formData.nome_escala}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Escala COPOM Dez/Jan"
              />
            </div>
            
            <div className="space-y-1 lg:col-span-1">
              <label className="text-sm font-medium text-gray-700">Descrição</label>
              <input
                type="text"
                name="descricao_escala"
                value={formData.descricao_escala}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Detalhes operacionais..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Data Início *</label>
              <input
                type="date"
                name="data_inicio"
                required
                value={formData.data_inicio}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Data Fim *</label>
              <input
                type="date"
                name="data_fim"
                required
                value={formData.data_fim}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="lg:col-span-4 flex justify-end mt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2 rounded-md text-white font-medium flex items-center transition-colors ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isLoading ? 'Solicitando...' : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Gerar Modelo
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Visualização da Grade da Escala */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Distribuição de Guarnições</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3 py-1 rounded">
              Editar Grade Ativa
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-center text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left w-48 sticky left-0 bg-gray-100 z-10">Dias do Mês</th>
                  {diasMes.map(dia => (
                    <th key={dia} className="border border-gray-300 p-2 min-w-[40px]">{dia}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {turnos.map((turno, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="border border-gray-300 p-2 text-left font-medium text-xs sticky left-0 bg-white z-10">{turno}</td>
                    {diasMes.map(dia => (
                      <td key={dia} className="border border-gray-300 p-2 cursor-pointer hover:bg-blue-50 text-gray-700 font-semibold">
                        {['A', 'B', 'C', 'D', 'E', 'F'][(dia + index) % 6]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Painel de Efetivo / Despachantes */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Efetivo por Guarnição (Despachantes)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {['A', 'B', 'C', 'D', 'E', 'F'].map((guarnicao) => (
              <div key={guarnicao} className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <h3 className="font-bold text-blue-800 text-lg">Equipe {guarnicao}</h3>
                  <div className="flex space-x-2">
                    <button className="text-gray-400 hover:text-blue-600" title="Adicionar Militar">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-600 max-h-40 overflow-y-auto pr-2">
                  <li className="flex justify-between items-center group">
                    <span>3° SGT FULANO</span>
                    <button className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity" title="Substituir/Remover">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                    </button>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}