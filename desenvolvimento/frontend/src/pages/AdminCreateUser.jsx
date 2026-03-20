import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AdminCreateUser() {
  const navigate = useNavigate();

  // Estados do formulário e status
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    matricula: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });

  // Novos estados para a barra de pesquisa
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  // Máscara visual para o CPF
  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    setFormData({ ...formData, cpf: value });
  };

  // Máscara visual para a Matrícula
  const handleMatriculaChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 12) value = value.substring(0, 12);
    value = value.replace(/(\d{10})(\d)/, "$1-$2");

    setFormData({ ...formData, matricula: value });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- NOVA FUNÇÃO: Buscar PMs ---
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchMessage("Digite um nome ou matrícula para buscar.");
      return;
    }

    setIsSearching(true);
    setSearchMessage("");
    setSearchResults([]);

    try {
      // Faz a requisição para a rota (o token deve estar configurado no seu ../services/api)
      const response = await api.get("/admin/allpm");
      const allPms = response.data;

      // Filtra os resultados baseados no texto digitado (nome ou matricula)
      const filtered = allPms.filter(
        (pm) =>
          pm.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pm.matricula.includes(searchTerm)
      );

      if (filtered.length === 0) {
        setSearchMessage("Nenhum policial encontrado com esses dados.");
      } else {
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error(error);
      setSearchMessage("Erro ao buscar dados do efetivo. Verifique sua conexão.");
    } finally {
      setIsSearching(false);
    }
  };

  // --- NOVA FUNÇÃO: Preencher formulário ao clicar em "Incluir" ---
  const handleInclude = (pm) => {
    setFormData((prev) => ({
      ...prev,
      nome: pm.nome,
      matricula: pm.matricula,
      // Se quiser que a senha padrão seja o CPF ou matrícula, pode adicionar aqui também!
    }));
    
    // Limpa a pesquisa após incluir para deixar a tela limpa
    setSearchResults([]);
    setSearchTerm("");
    setSearchMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", message: "A cadastrar usuário..." });

    try {
      await api.post("/admin/sign-up", formData);

      setStatus({
        type: "success",
        message: "Usuário cadastrado com sucesso!",
      });

      setFormData({
        nome: "",
        cpf: "",
        matricula: "",
        email: "",
        password: "",
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

        {/* --- INÍCIO DA SESSÃO DE PESQUISA --- */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar no Efetivo (Nome ou Matrícula)
          </label>
          
          {/* Ajuste de responsividade: empilha no mobile (flex-col), lado a lado no desktop (sm:flex-row) */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Digite para buscar..."
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
                  /* Ajuste na lista: empilha os textos e o botão de incluir no mobile, se necessário */
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 gap-3 bg-white border border-gray-200 rounded-md shadow-sm"
                >
                  <div className="text-sm w-full break-words">
                    <p className="font-bold text-gray-800">
                      {pm.patente} {pm.nome}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mat: {pm.matricula} | {pm.quadro}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInclude(pm)}
                    className="w-full sm:w-auto px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded shadow hover:bg-green-700 transition-colors shrink-0"
                  >
                    Incluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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