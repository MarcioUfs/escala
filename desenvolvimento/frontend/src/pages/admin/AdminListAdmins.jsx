import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowBigLeft } from "lucide-react";
import api from "../../services/api";

export default function AdminListAdmins() {
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Estados para o Modal de Exclusão e Alertas
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await api.get("/admin/alladmins");

        setAdmins(response.data);
      } catch (err) {
        const is404 = err.response?.status === 404;

        setActionMessage({
          type: "error",
          text: is404
            ? "Nenhum administrador encontrado."
            : "Erro ao carregar a lista.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []); // Array de dependências vazio para rodar apenas no mount

  const filteredAdmins = admins.filter((admin) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      admin.nome.toLowerCase().includes(searchLower) ||
      admin.id.includes(searchLower) ||
      admin.cpf.includes(searchLower)
    );
  });

  // ==========================================
  // LÓGICA DE DELETAR (UI/UX)
  // ==========================================

  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAdminToDelete(null);
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;

    try {
      await api.delete(`/admin/deleteadmin/${adminToDelete.id}`);

      setAdmins(admins.filter((u) => u.id !== adminToDelete.id));

      setActionMessage({
        type: "success",
        text: `O administrador ${adminToDelete.nome} foi removido!`,
      });

      closeDeleteModal();

      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error("Erro ao deletar administrador:", error);
      setActionMessage({
        type: "error",
        text: "Erro ao deletar administrador. Tente novamente.",
      });
      closeDeleteModal();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-xl text-gray-600">A carregar administradores...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* CABEÇALHO E BARRA DE PESQUISA */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestão de Administradores
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Total de administradores: {admins.length}
            </p>
          </div>

          <div className="w-full md:w-1/2 relative">
            <input
              type="text"
              placeholder="Pesquisar por nome, matrícula ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute right-3 top-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>

          <button
            onClick={() => navigate("/admin/sign-up")}
            className="w-full md:w-auto px-6 py-3 bg-blue-800 text-white font-medium rounded-lg hover:bg-blue-900 transition shadow-sm whitespace-nowrap"
          >
            Novo Administrador
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 w-full md:w-auto px-6 py-3 bg-green-800 text-white font-medium rounded-lg hover:bg-green-900 transition shadow-sm whitespace-nowrap"
          >
            <ArrowBigLeft />
            Voltar a gestão
          </button>
        </div>

        {/* MENSAGENS DE SUCESSO OU ERRO (TOAST) */}
        {actionMessage && (
          <div
            className={`mb-6 p-4 rounded-lg shadow-sm text-center font-medium animate-bounce ${
              actionMessage.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {actionMessage.text}
          </div>
        )}

        {/* VISÃO MOBILE (CARDS) */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {filteredAdmins.length > 0 ? (
            filteredAdmins.map((admin) => (
              <div
                key={admin.id}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {admin.nome}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Identificador: {admin.id}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase">
                    {admin.ordem}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">CPF:</span> {admin.cpf}
                </p>

                {/* BOTÕES NO MOBILE (Grid 2 colunas, todos de largura igual) */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() =>
                      navigate("/admin/view-admin", { state: { admin } })
                    }
                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition text-center"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() =>
                      navigate("/admin/edit-user", { state: { admin } })
                    }
                    className="w-full py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm font-medium transition text-center"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(admin)}
                    className="w-full py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition text-center"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8 bg-white rounded-lg border border-gray-200">
              Nenhum Administrador encontrado com "{searchTerm}".
            </p>
          )}
        </div>

        {/* VISÃO DESKTOP/TABLET (TABELA) */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="p-4 border-b font-semibold">Nome</th>
                  <th className="p-4 border-b font-semibold">Identificador</th>

                  <th className="p-4 border-b font-semibold">CPF</th>
                  <th className="p-4 border-b font-semibold text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAdmins.length > 0 ? (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-900 font-medium">
                        {admin.nome}
                        <div className="text-xs text-gray-500 font-normal">
                          {admin.email}
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">{admin.id}</td>
                      <td className="p-4 text-gray-700">{admin.cpf}</td>

                      <td className="p-4">
                        {/* BOTÕES NO DESKTOP (Flex horizontal sem quebrar, botões de largura igual min-w) */}
                        <div className="flex items-center justify-center gap-2 flex-nowrap">
                          <button
                            onClick={() =>
                              navigate("/admin/view-admin", {
                                state: { admin },
                              })
                            }
                            className="min-w-[70px] px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition text-center"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() =>
                              navigate("/admin/edit-user", { state: { admin } })
                            }
                            className="min-w-[70px] px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 text-sm font-medium transition text-center"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(admin)}
                            className="min-w-[70px] px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition text-center"
                          >
                            Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      Nenhum Adminsitrador encontrado com a pesquisa "
                      {searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL DE CONFIRMAÇÃO DE DELEÇÃO (OVERLAY)
          ========================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-6 text-center">
              {/* Ícone de Alerta */}
              <svg
                className="mx-auto mb-4 w-12 h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Excluir Administrador?
              </h3>
              <p className="text-gray-500 mb-6">
                Tem a certeza que deseja excluir permanentemente o administrador{" "}
                <span className="font-bold text-gray-800">
                  {adminToDelete?.nome}
                </span>
                ? Esta ação não pode ser desfeita.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={closeDeleteModal}
                  className="w-full px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="w-full px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
