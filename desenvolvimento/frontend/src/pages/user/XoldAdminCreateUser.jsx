import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function AdminCreateUser() {
  const navigate = useNavigate();

  // Estados do formulário, incluindo o novo campo 'telefone'
  const [formData, setFormData] = useState({
    nome: "",
    nome_guerra: "",
    cpf: "",
    matricula: "",
    email: "",
    password: "",
    telefone: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });

  // const [searchTerm, setSearchTerm] = useState("");
  // const [searchResults, setSearchResults] = useState([]);
  // const [isSearching, setIsSearching] = useState(false);
  // const [searchMessage, setSearchMessage] = useState("");

  // ================= MÁSCARAS =================
  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setFormData({ ...formData, cpf: value });
  };

  const handleMatriculaChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 12) value = value.substring(0, 12);
    value = value.replace(/(\d{10})(\d)/, "$1-$2");
    setFormData({ ...formData, matricula: value });
  };

  const handleTelefoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    setFormData({ ...formData, telefone: value });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ================= PESQUISA E LÓGICA DE USUÁRIOS =================
  // const handleSearch = async () => {
  //   const term = searchTerm.trim();
  //   if (!term) {
  //     setSearchMessage("Digite uma matrícula para buscar.");
  //     return;
  //   }

  //   setIsSearching(true);
  //   setSearchMessage("");
  //   setSearchResults([]);

  //   try {
  //     // 1. Busca todos os PMs
  //     const responseAllPm = await api.get("/admin/allpm");
  //     const allPms = responseAllPm.data;

  //     // 2. Busca os usuários já cadastrados no sistema (Ajuste a rota conforme seu backend)
  //     // Presumindo que retorne um array de usuários com a propriedade 'matricula'
  //     let registeredUsers = [];
  //     try {
  //       const responseUsers = await api.get("/admin/users");
  //       registeredUsers = responseUsers.data;
  //     } catch (err) {
  //       console.warn(
  //         "Não foi possível buscar a lista de usuários cadastrados.",
  //         err,
  //       );
  //     }

  //     // 3. Filtra pela matrícula digitada
  //     const filtered = allPms.filter((pm) => pm.matricula.includes(term));

  //     if (filtered.length === 0) {
  //       setSearchMessage("Nenhum policial encontrado com essa matrícula.");
  //     } else {
  //       // Mapeia adicionando a flag se já está cadastrado
  //       const resultsWithStatus = filtered.map((pm) => {
  //         const isRegistered = registeredUsers.some(
  //           (user) => user.matricula === pm.matricula,
  //         );
  //         return { ...pm, isRegistered };
  //       });
  //       setSearchResults(resultsWithStatus);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     setSearchMessage("Erro ao buscar dados. Verifique sua conexão.");
  //   } finally {
  //     setIsSearching(false);
  //   }
  // };

  // const handleInclude = (pm) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     nome: pm.nome,
  //     matricula: pm.matricula,
  //   }));
  //   setSearchResults([]);
  //   setSearchTerm("");
  //   setSearchMessage("");
  // };

  // const handleDeleteUser = async (matricula) => {
  //   const confirmDelete = window.confirm(
  //     `Tem certeza que deseja excluir o usuário com matrícula ${matricula}?`,
  //   );
  //   if (!confirmDelete) return;

  //   try {
  //     // Ajuste a rota de deleção conforme a sua API
  //     await api.delete(`/admin/users/${matricula}`);
  //     alert("Usuário excluído com sucesso!");

  //     // Limpa a busca para atualizar a tela
  //     setSearchResults([]);
  //     setSearchTerm("");
  //   } catch (error) {
  //     console.error(error);
  //     alert("Erro ao excluir usuário. Tente novamente.");
  //   }
  // };

  // ================= SUBMIT E VALIDAÇÕES =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Aplicação do Trim em todos os campos para evitar espaços extras
    const payload = {
      nome: formData.nome.trim(),
      nome_guerra: formData.nome_guerra.trim(),
      cpf: formData.cpf.trim(),
      matricula: formData.matricula.trim(),
      email: formData.email.trim(),
      password: formData.password.trim(),
      telefone: formData.telefone.trim(),
    };

    // Validação básica e efetiva de E-mail via Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      setStatus({
        type: "error",
        message: "Por favor, insira um e-mail válido.",
      });
      return;
    }

    setStatus({ type: "loading", message: "A cadastrar usuário..." });

    try {
      await api.post("/admin/createuser", payload);

      setStatus({
        type: "success",
        message: "Usuário cadastrado com sucesso!",
      });

      setFormData({
        nome: "",
        nome_guerra: "",
        cpf: "",
        matricula: "",
        email: "",
        password: "",
        telefone: "",
      });

      setTimeout(() => {
        navigate("/admin");
      }, 2000);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        setStatus({
          type: "error",
          message: "Email, Matrícula ou CPF já cadastrado!",
        });
      } else if (error.response?.status === 403) {
        setStatus({
          type: "error",
          message: "Preencha todos os campos obrigatórios!",
        });
      } else {
        setStatus({
          type: "error",
          message: "Erro interno do servidor. Tente novamente.",
        });
      }
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 flex justify-center w-full box-border overflow-hidden">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 sm:p-8 border-t-4 border-blue-500">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Novo Usuário</h2>
          <p className="text-sm text-gray-600">
            Cadastro de perfil comum (Operacional)
          </p>
        </div>

        {/* --- SESSÃO DE PESQUISA --- */}
        {/* <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar no Efetivo (Matrícula)
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Digite a matrícula..."
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {isSearching ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {searchMessage && (
            <p className="mt-2 text-xs text-red-600 font-medium">
              {searchMessage}
            </p>
          )}

          {searchResults.length > 0 && (
            <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
              {searchResults.map((pm) => (
                <li
                  key={pm.id}
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 gap-3 bg-white border rounded-md shadow-sm ${
                    pm.isRegistered
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="text-sm w-full break-words">
                    <p
                      className={`font-bold ${pm.isRegistered ? "text-red-600" : "text-gray-800"}`}
                    >
                      {pm.patente} {pm.nome}
                    </p>
                    <p
                      className={`text-xs ${pm.isRegistered ? "text-red-500" : "text-gray-500"}`}
                    >
                      Mat: {pm.matricula} | {pm.quadro}
                    </p>
                  </div>

                  {pm.isRegistered ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(pm.matricula)}
                      className="w-full sm:w-auto px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow hover:bg-red-700 transition-colors shrink-0"
                    >
                      Excluir
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInclude(pm)}
                      className="w-full sm:w-auto px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded shadow hover:bg-green-700 transition-colors shrink-0"
                    >
                      Incluir
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div> */}
        {/* --- FIM DA SESSÃO DE PESQUISA --- */}

        {status.message && (
          <div
            className={`mb-4 p-3 rounded text-sm text-center font-medium ${
              status.type === "success"
                ? "bg-green-100 text-green-700"
                : status.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome Completo
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome de Guerra
            </label>
            <input
              type="text"
              name="nome_guerra"
              value={formData.nome_guerra}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              CPF
            </label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Matrícula
            </label>
            <input
              type="text"
              name="matricula"
              value={formData.matricula}
              onChange={handleMatriculaChange}
              placeholder="0000000000-00"
              maxLength={13}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={handleTelefoneChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="exemplo@email.com"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Senha Padrão
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="w-full sm:w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={status.type === "loading"}
              className="w-full sm:w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {status.type === "loading" ? "A Salvar..." : "Cadastrar Usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
