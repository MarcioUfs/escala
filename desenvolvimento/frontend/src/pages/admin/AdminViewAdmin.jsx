import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Visualização de um administrador.
//
// Antes esta tela lia location.state?.user — mas quem navega pra cá vindo
// de /admin/admins manda { admin } no state (um admin não é um "user": não
// tem matrícula, patente, telefone). Como a chave nunca batia, a tela nunca
// achava dado e, pelo useEffect abaixo, chutava de volta pra lista de
// USUÁRIOS (/admin/users) — a tela de administradores nunca funcionou.
export default function AdminViewAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  const admin = location.state?.admin;

  // Se entrar na página diretamente pela URL (sem vir do clique na lista),
  // não há dado pra mostrar — volta pra lista de administradores.
  useEffect(() => {
    if (!admin) {
      navigate("/admin/admins");
    }
  }, [admin, navigate]);

  if (!admin) return null;

  return (
    <div>
      <main className="flex-grow p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            <div className="h-2 bg-indigo-500 w-full absolute top-0 left-0" />

            <div className="p-6 sm:p-8 mt-2 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="h-24 w-24 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-4xl font-bold shadow-inner border-4 border-white ring-2 ring-indigo-50">
                {admin.nome.charAt(0).toUpperCase()}
              </div>

              <div className="text-center sm:text-left flex-grow">
                <h2 className="text-2xl font-bold text-gray-900">{admin.nome}</h2>
                <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wide border border-indigo-200">
                    Perfil: {admin.role || "admin"}
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wide border border-blue-200">
                    ID: #{admin.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Grelha de Dados Pessoais — "Matrícula" removida aqui: um
                administrador não tem esse campo (é exclusivo de usuário
                comum). No lugar, Identificador e datas de cadastro. */}
            <div className="bg-gray-50 border-t border-gray-100 p-6 sm:p-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                Informações de Cadastro
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Identificador</p>
                  <p className="text-gray-900 font-medium text-lg">{admin.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">CPF</p>
                  <p className="text-gray-900 font-medium text-lg">{admin.cpf}</p>
                </div>
                {admin.created_at && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Criado em</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(admin.created_at).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(admin.created_at).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                )}
                {admin.updated_at && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Última atualização
                    </p>
                    <p className="text-gray-900 font-medium">
                      {new Date(admin.updated_at).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(admin.updated_at).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border-t border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/admin/admins")}
                className="w-full sm:w-1/2 flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                Voltar
              </button>
              <button
                onClick={() => navigate("/admin/edit-admin", { state: { admin } })}
                className="w-full sm:w-1/2 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  ></path>
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
