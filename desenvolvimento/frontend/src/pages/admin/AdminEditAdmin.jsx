import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";

// Edição de um administrador (pelo próprio painel admin).
//
// Antes, o botão "Editar" de /admin/admins apontava pra /admin/edit-user —
// a tela de edição de USUÁRIOS comuns (matrícula, patente, telefone,
// e-mail), que exige "userToEdit" em location.state. Quem navega vindo da
// lista de admins manda { admin }, não { user } — então aquela tela nunca
// achava o dado e chutava de volta pra lista de usuários.
//
// Este formulário só tem os campos que PUT /admin/updateadmin realmente
// aceita: nome e cpf. Um admin não tem matrícula nem patente.
export default function AdminEditAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  const adminParaEditar = location.state?.admin;

  const [formData, setFormData] = useState({
    id: adminParaEditar?.id || "",
    nome: adminParaEditar?.nome || "",
    cpf: adminParaEditar?.cpf || "",
  });

  const [status, setStatus] = useState({ type: "", message: "" });

  // Só chuta pra fora se entrou direto pela URL, sem dado nenhum.
  useEffect(() => {
    if (!adminParaEditar) {
      navigate("/admin/admins");
    }
  }, [adminParaEditar, navigate]);

  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setFormData((f) => ({ ...f, cpf: value }));
  };

  const handleChange = (e) => {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", message: "A atualizar administrador..." });

    try {
      await api.put("/admin/updateadmin", formData);
      setStatus({ type: "success", message: "Administrador atualizado com sucesso!" });
      setTimeout(() => navigate("/admin/admins"), 1500);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        setStatus({ type: "error", message: "CPF já cadastrado em outra conta!" });
      } else if (error.response?.status === 400) {
        setStatus({ type: "error", message: error.response.data?.msg || "Preencha todos os campos." });
      } else {
        setStatus({ type: "error", message: "Erro interno do servidor. Tente novamente." });
      }
    }
  };

  if (!adminParaEditar) return null;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
      {/* Borda amarela: mesmo indicador de "edição" usado no resto do
          sistema (AdminEditUser) — convenção de ação, não cor de marca. */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-8 border-t-4 border-yellow-500">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Editar Administrador</h2>
          <p className="text-sm text-gray-600">
            Atualize os dados de <span className="font-semibold">{adminParaEditar.nome}</span>
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
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
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
            <label className="block text-sm font-medium text-gray-700">CPF</label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleCpfChange}
              maxLength={14}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate("/admin/admins")}
              className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={status.type === "loading"}
              className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 transition disabled:opacity-50"
            >
              {status.type === "loading" ? "A Salvar..." : "Atualizar Dados"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
