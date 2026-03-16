import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AdminCreateUser() {
  const navigate = useNavigate();

  // Estado que espelha os dados exigidos pelo seu backend (sem o role, pois o backend já define)
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    matricula: "",
    email: "",
    password: "",
  });

  const [status, setStatus] = useState({ type: "", message: "" });

  // Máscara visual para o CPF
  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    setFormData({ ...formData, cpf: value });
  };

  // Nova máscara visual para a Matrícula (ex: 2002070018-90)
  const handleMatriculaChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não for número
    if (value.length > 12) value = value.substring(0, 12); // Limita a 12 números

    // Coloca o traço após o 10º dígito
    value = value.replace(/(\d{10})(\d)/, "$1-$2");

    setFormData({ ...formData, matricula: value });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

      // Limpa os campos do formulário após o sucesso
      setFormData({
        nome: "",
        cpf: "",
        matricula: "",
        email: "",
        password: "",
      });

      // Retorna ao painel de administração após 2 segundos
      setTimeout(() => {
        navigate("/admin");
      }, 2000);
    } catch (error) {
      console.error(error);
      // Tratamento de erros baseado nas respostas do seu Controller
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
    <div className="py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-8 border-t-4 border-blue-500">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Novo Usuário</h2>
          <p className="text-sm text-gray-600">
            Cadastro de perfil comum (Operacional)
          </p>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={status.type === "loading"}
              className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {status.type === "loading" ? "A Salvar..." : "Cadastrar Usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
