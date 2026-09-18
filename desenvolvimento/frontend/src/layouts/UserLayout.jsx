import { useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

export default function UserLayout() {
  const { signOut } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* NAVBAR FIXA DO UTILIZADOR */}
      <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" 
            onClick={() => navigate('/user')}
          >
            <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <h1 className="text-xl font-bold tracking-wide">Portal Operacional</h1>
          </div>
          
          <button 
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-md transition text-sm font-medium border border-emerald-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* ÁREA ONDE O DASHBOARD VAI APARECER */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Botões flutuantes de navegação vertical — ficam aqui (e não em cada
          página) para valer em todas as telas privadas do usuário; login e
          rotas públicas não usam este layout. */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Voltar ao topo"
          aria-label="Voltar ao topo"
          className="flex items-center justify-center size-12 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition"
        >
          <ArrowUp size={20} />
        </button>
        <button
          type="button"
          onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
          title="Descer uma página"
          aria-label="Descer uma página"
          className="flex items-center justify-center size-12 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition"
        >
          <ArrowDown size={20} />
        </button>
      </div>
    </div>
  );
}