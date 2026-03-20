import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { user, signOut } = useContext(AuthContext);

  return (
    <div className="p-4 sm:p-8 w-full max-w-full overflow-hidden box-border">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-5 sm:p-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-5 mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 break-words">
            Painel do Administrador
          </h1>
          <button
            onClick={signOut}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors shadow-sm"
          >
            Sair
          </button>
        </div>

        {/* Informações do Usuário */}
        <div className="mb-8">
          <p className="text-gray-600 text-base sm:text-lg">
            Bem-vindo(a),{" "}
            <span className="font-bold text-gray-900">
              {user?.nome || "Administrador"}
            </span>
            .
          </p>

          {/* Badges para as informações secundárias */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              Matrícula: {user?.matricula}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Perfil: {user?.role}
            </span>
          </div>
        </div>

        {/* Área de Módulos (Grid para separar bem as caixas) */}
        <div className="grid grid-cols-1 gap-6">
          {/* Módulo Principal */}
          <div className="p-5 sm:p-6 bg-blue-50/50 border border-blue-200 rounded-xl">
            <h2 className="text-lg font-bold text-blue-900 mb-2">
              Módulo Administrativo
            </h2>
            <p className="text-sm sm:text-base text-blue-700 mb-5">
              Gerencie os usuários e administradores do sistema.
            </p>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/admin/users"
                className="w-full sm:w-auto text-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Gerir Utilizadores
              </Link>

              <Link
                to="/admin/sign-up"
                className="w-full sm:w-auto text-center px-5 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
              >
                + Novo Administrador
              </Link>
            </div>
          </div>

          {/* Módulo de Aviso */}
          <div className="p-5 sm:p-6 bg-gray-50 border border-gray-200 rounded-xl">
            <h2 className="text-base font-bold text-gray-800">
              Módulo Administrativo
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Apenas usuários com perfil "admin" podem ver esta tela.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}