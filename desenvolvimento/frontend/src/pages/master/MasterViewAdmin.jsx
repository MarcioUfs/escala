import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Pencil } from "lucide-react";

// Visualização de um administrador pelo master.
//
// Mesma estrutura visual de AdminViewAdmin.jsx (card com avatar + grade de
// dados), mas corrigindo o bug de origem daquela tela: ela lê
// location.state?.user, porém quem navega até ela manda { admin } no state
// — então nunca encontra dado nenhum e é chutada de volta pra lista. Aqui lê
// location.state?.admin, que é o que a lista de fato envia.
export default function MasterViewAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  const admin = location.state?.admin;

  // Se entrar na página diretamente pela URL (sem vir do clique na lista),
  // não há dado pra mostrar — volta pra lista.
  useEffect(() => {
    if (!admin) {
      navigate("/master");
    }
  }, [admin, navigate]);

  if (!admin) return null;

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          <div className="h-2 bg-red-600 w-full absolute top-0 left-0" />

          <div className="p-6 sm:p-8 mt-2 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="h-24 w-24 shrink-0 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-4xl font-bold shadow-inner border-4 border-white ring-2 ring-red-50">
              {admin.nome.charAt(0).toUpperCase()}
            </div>

            <div className="text-center sm:text-left flex-grow">
              <h2 className="text-2xl font-bold text-gray-900">{admin.nome}</h2>
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full uppercase tracking-wide border border-red-200">
                  Perfil: {admin.role}
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wide border border-blue-200">
                  ID: #{admin.id}
                </span>
              </div>
            </div>
          </div>

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
              onClick={() => navigate("/master")}
              className="w-full sm:w-1/2 flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              Voltar
            </button>
            <button
              onClick={() => navigate("/master/edit-admin", { state: { admin } })}
              className="w-full sm:w-1/2 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800 transition"
            >
              <Pencil size={16} />
              Editar Dados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
