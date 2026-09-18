import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, ArrowDown, ArrowLeft, Plus, Radio, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../services/api";

const TAMANHO_PAGINA = 100;

export default function AdminListUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);

  // Estados para o Modal de Exclusão e Alertas
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const navigate = useNavigate();

  // 1. PRIMEIRO: Declaramos a função
  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/allusers");
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setActionMessage({
          type: "error",
          text: "Nenhum utilizador encontrado no sistema.",
        });
      } else {
        setActionMessage({
          type: "error",
          text: "Erro ao carregar a lista de utilizadores.",
        });
      }
      setLoading(false);
    }
  };

  // 2. DEPOIS: Chamamos a função no useEffect (O erro vermelho some aqui!)
  // useEffect(() => {
  //   fetchUsers();
  // }, []);
  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers();
    };
    loadUsers();
  }, []);
  
  // CPF e matrícula vêm formatados (com ponto/traço) do backend. Comparar
  // só os DÍGITOS dos dois lados faz a busca funcionar digitando com ou sem
  // pontuação (111.111.111-11 ou 11111111111).
  const filteredUsers = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return users;
    const termoDigitos = termo.replace(/\D/g, "");
    return users.filter((user) => {
      const nomeBate = (user.nome || "").toLowerCase().includes(termo);
      const cpfBate =
        (user.cpf || "").includes(termo) ||
        (termoDigitos !== "" && (user.cpf || "").replace(/\D/g, "").includes(termoDigitos));
      const matriculaBate =
        (user.matricula || "").includes(termo) ||
        (termoDigitos !== "" && (user.matricula || "").replace(/\D/g, "").includes(termoDigitos));
      return nomeBate || cpfBate || matriculaBate;
    });
  }, [users, searchTerm]);

  const totalPaginas = Math.max(1, Math.ceil(filteredUsers.length / TAMANHO_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicioPagina = (paginaAtual - 1) * TAMANHO_PAGINA;
  const usersDaPagina = filteredUsers.slice(inicioPagina, inicioPagina + TAMANHO_PAGINA);

  const irParaPagina = (nova) => {
    setPagina(Math.min(Math.max(1, nova), totalPaginas));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==========================================
  // LÓGICA DE DELETAR (UI/UX)
  // ==========================================

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/admin/deleteuser/${userToDelete.id}`);

      setUsers(users.filter((u) => u.id !== userToDelete.id));

      setActionMessage({
        type: "success",
        text: `O utilizador ${userToDelete.nome} foi removido!`,
      });

      closeDeleteModal();

      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setActionMessage({
        type: "error",
        text: "Erro ao deletar utilizador. Tente novamente.",
      });
      closeDeleteModal();
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const toggleEscala = (userId) => {
    alert(
      `Lógica de escalar para o utilizador ID: ${userId} será implementada aqui!`,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-xl text-gray-600">A carregar utilizadores...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* CABEÇALHO — mesmo padrão de /admin/escala */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              Gestão de Utilizadores
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Total de utilizadores: {users.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin/create-user")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Novo Utilizador</span>
            </button>
            <button
              onClick={() => navigate("/admin/escala")}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition shadow-sm"
            >
              <Radio size={16} />
              <span className="hidden sm:inline">Escala</span>
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white text-sm font-medium rounded-lg hover:bg-green-900 transition shadow-sm"
            >
              <ArrowLeft size={16} />
              Voltar a gestão
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* BARRA DE PESQUISA */}
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Pesquisar por nome, matrícula ou CPF..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagina(1);
            }}
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute right-3 top-3"
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
        {/*.toUpperCase()*/}
        {/* VISÃO MOBILE (CARDS) */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {filteredUsers.length > 0 ? (
            usersDaPagina.map((user) => (
              <div
                key={user.id}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {user.nome.toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Matrícula: {user.matricula}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase">
                    {user.ativo.toUpperCase()}
                    {/* {user.ordem} */}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Nome de Guerra:</span>{" "}
                  {user.nome_guerra.toUpperCase()}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">CPF:</span> {user.cpf}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Telefone:</span>{" "}
                  {user.telefone}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Patente/Graduação:</span>{" "}
                  {user.nome_patente.toUpperCase()}
                </p>
                {/* <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Quadro:</span> {user.quadro.toUpperCase()}
                </p> */}
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-semibold">E-mail:</span>{" "}
                  {user.email.toUpperCase()}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-semibold">Status:</span>{" "}
                  {user.ativo.toUpperCase()}
                </p>

                {/* BOTÕES NO MOBILE (Grid 2 colunas, todos de largura igual) */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() =>
                      navigate("/admin/view-user", { state: { user } })
                    }
                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition text-center"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() =>
                      navigate("/admin/edit-user", { state: { user } })
                    }
                    className="w-full py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm font-medium transition text-center"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(user)}
                    className="w-full py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition text-center"
                  >
                    Deletar
                  </button>
                  <button
                    onClick={() => toggleEscala(user.id)}
                    className="w-full py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm font-medium transition text-center"
                  >
                    Escalar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8 bg-white rounded-lg border border-gray-200">
              Nenhum utilizador encontrado com "{searchTerm}".
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
                  {/* <th className="p-4 border-b font-semibold">Patente</th> */}
                  <th className="p-4 border-b font-semibold">Nome de guerra</th>
                  <th className="p-4 border-b font-semibold">Telefone</th>
                  {/* <th className="p-4 border-b font-semibold">Status</th> */}
                  {/* <th className="p-4 border-b font-semibold">Quadro</th> */}
                  <th className="p-4 border-b font-semibold">Matrícula</th>
                  <th className="p-4 border-b font-semibold">CPF</th>
                  {/* <th className="p-4 border-b font-semibold">Ordem</th> */}
                  <th className="p-4 border-b font-semibold text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  usersDaPagina.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-900 font-medium">
                        {user.ativo.toUpperCase() +
                          " - " +
                          user.nome.toUpperCase()}
                        <div className="text-xs text-gray-500 font-normal">
                          {user.email}
                        </div>
                      </td>
                      <td className="p-4 text-gray-900 font-medium">
                        {user.sigla_patente.toUpperCase() +
                          " " +
                          user.nome_guerra.toUpperCase()}
                        {/* <div className="text-xs text-gray-500 font-normal">
                          {user.quadro.toUpperCase()}
                        </div> */}
                      </td>
                      {/* <td className="p-4 text-gray-700">{user.patente.toUpperCase()}</td> */}
                      {/* <td className="p-4 text-gray-700">{user.patente.toUpperCase() + ' ' + user.nome_guerra.toUpperCase()}</td> */}
                      <td className="p-4 text-gray-700">{user.telefone}</td>
                      {/* <td className="p-4 text-gray-700">{user.ativo ? 'A' : 'I'}</td> */}
                      {/* <td className="p-4 text-gray-700">{user.quadro.toUpperCase()}</td> */}
                      <td className="p-4 text-gray-700">{user.matricula}</td>
                      <td className="p-4 text-gray-700">{user.cpf}</td>
                      {/* <td className="p-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase">
                          {user.ordem}
                        </span>
                      </td> */}
                      <td className="p-4">
                        {/* BOTÕES NO DESKTOP (Flex horizontal sem quebrar, botões de largura igual min-w) */}
                        <div className="flex items-center justify-center gap-2 flex-nowrap">
                          <button
                            onClick={() =>
                              navigate("/admin/view-user", { state: { user } })
                            }
                            className="min-w-[70px] px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition text-center"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() =>
                              navigate("/admin/edit-user", { state: { user } })
                            }
                            className="min-w-[70px] px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 text-sm font-medium transition text-center"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="min-w-[70px] px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition text-center"
                          >
                            Deletar
                          </button>
                          <button
                            onClick={() => toggleEscala(user.id)}
                            className="min-w-[70px] px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-md hover:bg-emerald-200 text-sm font-medium transition text-center"
                          >
                            Escalar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      Nenhum utilizador encontrado com a pesquisa "{searchTerm}
                      ".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINAÇÃO — 100 militares por página */}
        {filteredUsers.length > TAMANHO_PAGINA && (
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm text-gray-600">
              Exibindo {inicioPagina + 1}–
              {Math.min(inicioPagina + TAMANHO_PAGINA, filteredUsers.length)} de {filteredUsers.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => irParaPagina(paginaAtual - 1)}
                disabled={paginaAtual === 1}
                aria-label="Página anterior"
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span className="px-2 text-sm font-mono text-gray-700">
                {paginaAtual} / {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => irParaPagina(paginaAtual + 1)}
                disabled={paginaAtual === totalPaginas}
                aria-label="Próxima página"
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Próxima
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
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
                Excluir Utilizador?
              </h3>
              <p className="text-gray-500 mb-6">
                Tem a certeza que deseja excluir permanentemente o utilizador{" "}
                <span className="font-bold text-gray-800">
                  {userToDelete?.nome}
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

      {/* Botões flutuantes de navegação vertical — mesmo padrão de
          /admin/escala. */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Voltar ao topo"
          aria-label="Voltar ao topo"
          className="flex items-center justify-center size-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition"
        >
          <ArrowUp size={20} />
        </button>
        <button
          type="button"
          onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
          title="Descer uma página"
          aria-label="Descer uma página"
          className="flex items-center justify-center size-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition"
        >
          <ArrowDown size={20} />
        </button>
      </div>
    </div>
  );
}
