import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminViewUser() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Puxa os dados que vieram do clique na tabela
  const userToView = location.state?.user;

  // Se entrar na página diretamente pela URL, volta para a lista
  useEffect(() => {
    if (!userToView) {
      navigate('/admin/users');
    }
  }, [userToView, navigate]);

  if (!userToView) return null;

  return (
    <div>
      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-grow p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* CARTÃO DE PERFIL */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            
            {/* Faixa decorativa no topo do card */}
            <div className="h-2 bg-indigo-500 w-full absolute top-0 left-0"></div>

            <div className="p-6 sm:p-8 mt-2 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              
              {/* Avatar Dinâmico */}
              <div className="h-24 w-24 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-4xl font-bold shadow-inner border-4 border-white ring-2 ring-indigo-50">
                {userToView.nome.charAt(0).toUpperCase()}
              </div>
              
              <div className="text-center sm:text-left flex-grow">
                <h2 className="text-2xl font-bold text-gray-900">{userToView.nome}</h2>
                <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wide border border-indigo-200">
                    Perfil: {userToView.perfil || userToView.role || 'user'}
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wide border border-blue-200">
                    ID: #{userToView.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Grelha de Dados Pessoais */}
            <div className="bg-gray-50 border-t border-gray-100 p-6 sm:p-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Informações de Cadastro</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Matrícula</p>
                  <p className="text-gray-900 font-medium text-lg">{userToView.matricula}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">CPF</p>
                  <p className="text-gray-900 font-medium text-lg">{userToView.cpf}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">E-mail</p>
                  <p className="text-gray-900 font-medium text-lg break-words">{userToView.email}</p>
                </div>
              </div>
            </div>

            {/* Rodapé de Ações */}
            <div className="bg-white border-t border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/admin/users')} 
                className="w-full sm:w-1/2 flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                Voltar
              </button>
              <button 
                onClick={() => navigate('/admin/edit-user', { state: { user: userToView } })} 
                className="w-full sm:w-1/2 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
                Editar Dados
              </button>
            </div>

          </div>
        </div>
      </main>
      
    </div>
  );
}