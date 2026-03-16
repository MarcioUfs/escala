import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { user, signOut } = useContext(AuthContext);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Painel do Administrador
          </h1>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Sair
          </button>
        </div>

        <p className="text-gray-600 text-lg">
          Bem-vindo(a),{" "}
          <span className="font-semibold text-gray-900">
            {user?.nome || "Administrador"}
          </span>
          .
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Matrícula: {user?.matricula} | Perfil: {user?.role}
        </p>

        {/* Aqui entrará o seu CRUD posteriormente */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="font-bold text-blue-800 mb-2">
            Módulo Administrativo
          </h2>
          <p className="text-blue-600 mb-4">
            Gerencie os usuários e administradores do sistema.
          </p>

          <div className="flex gap-4">
            <Link
              to="/admin/users"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Gerir Utilizadores
            </Link>

            <Link
              to="/admin/sign-up"
              className="inline-block px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 transition"
            >
              + Novo Administrador
            </Link>
          </div>
        </div>
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="font-bold text-blue-800">Módulo Administrativo</h2>
          <p className="text-blue-600 mt-1">
            Apenas usuários com perfil "admin" podem ver esta tela.
          </p>
        </div>
      </div>
    </div>
  );
}
