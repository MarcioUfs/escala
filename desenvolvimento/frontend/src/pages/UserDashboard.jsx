import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function UserDashboard() {
  const { user } = useContext(AuthContext);

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* CARTÃO DE PERFIL */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Avatar Dinâmico */}
            <div className="h-24 w-24 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-4xl font-bold shadow-inner border-4 border-white ring-2 ring-emerald-50">
              {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <div className="text-center sm:text-left flex-grow">
              <h2 className="text-2xl font-bold text-gray-900">{user?.nome || 'Usuário Operacional'}</h2>
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full uppercase tracking-wide border border-emerald-200">
                  Perfil: {user?.role || 'user'}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full uppercase tracking-wide border border-gray-200">
                  Ativo
                </span>
              </div>
            </div>
          </div>

          {/* Grelha de Dados Pessoais */}
          <div className="bg-gray-50 border-t border-gray-100 p-6 sm:p-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Meus Dados de Cadastro</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Matrícula</p>
                <p className="text-gray-900 font-medium">{user?.matricula || '---'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">CPF</p>
                <p className="text-gray-900 font-medium">{user?.cpf || '---'}</p>
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">E-mail</p>
                <p className="text-gray-900 font-medium truncate">{user?.email || '---'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* HUB DE AÇÕES (Módulos) */}
        <h3 className="text-lg font-bold text-gray-800 mt-8 mb-4 px-2">Módulos do Sistema</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card: Escala de Serviço */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-emerald-300 transition cursor-pointer group">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Escala de Serviço</h4>
            <p className="text-sm text-gray-600">Visualize as suas escalas, horários e locais de serviço agendados.</p>
          </div>

          {/* Card: Avisos/Notificações */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition cursor-pointer group">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Avisos e Boletins</h4>
            <p className="text-sm text-gray-600">Consulte comunicados e informações importantes da administração.</p>
          </div>

        </div>

      </div>
    </div>
  );
}