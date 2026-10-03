import { useContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ShieldAlert, LogOut, Settings } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";

// Layout do perfil MASTER — vermelho de propósito, para nunca haver dúvida
// sobre em qual nível de permissão a sessão está. O painel administrativo
// (azul) continua acessível ao master pelo botão abaixo.
export default function MasterLayout() {
  const { signOut, user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-red-50 flex flex-col">
      <header className="bg-red-900 text-white shadow-md sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition min-w-0"
            onClick={() => navigate("/master")}
          >
            <ShieldAlert className="text-red-300 flex-shrink-0" size={24} />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-wide truncate">Portal Master</h1>
              {user?.nome && (
                <p className="text-[11px] text-red-200 truncate">{user.nome}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-800 hover:bg-red-700 rounded-md transition text-sm font-medium border border-red-700"
              title="Abrir o painel administrativo com este mesmo acesso"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Painel admin</span>
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-800 hover:bg-red-700 rounded-md transition text-sm font-medium border border-red-700"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}
