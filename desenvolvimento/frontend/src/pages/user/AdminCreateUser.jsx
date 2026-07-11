import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function AdminCreateUser() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: "",
    nome_guerra: "",
    cpf: "",
    matricula: "",
    email: "",
    password: "",
    telefone: "",
    id_patente: "",
  });

  // Estado para armazenar a lista de patentes vindas do backend
  const [patentes, setPatentes] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });

  // ================= BUSCA DE PATENTES (BACKEND) =================
  useEffect(() => {
    const fetchPatentes = async () => {
      try {
        const response = await api.get("/admin/allpatentes");
        // Garante que o dado recebido seja um array antes de salvar no estado
        if (Array.isArray(response.data)) {
          setPatentes(response.data);
        } else {
          setPatentes([]);
        }
      } catch (error) {
        console.error("Erro ao buscar patentes:", error);
        setStatus({
          type: "error",
          message: "Erro ao carregar a lista de patentes do servidor.",
        });
      }
    };

    fetchPatentes();
  }, []);

  // ================= MÁSCARAS =================
  const handleNomeChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
    value = value.replace(/\s{2,}/g, " ");
    value = value.replace(/^\s+/g, "");
    setFormData({ ...formData, nome: value });
  };

  const handleNomeGuerraChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
    value = value.replace(/\s{2,}/g, " ");
    value = value.replace(/^\s+/g, "");
    setFormData({ ...formData, nome_guerra: value });
  };

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
      id_patente: formData.id_patente,
    };

    // Validação de seleção obrigatória da patente
    if (!payload.id_patente) {
      setStatus({
        type: "error",
        message: "Por favor, selecione uma patente válida.",
      });
      return;
    }

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
        id_patente: "",
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
          message: error.response?.data?.message || "Erro interno do servidor. Tente novamente.",
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
              onChange={handleNomeChange}
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
              onChange={handleNomeGuerraChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Patente
            </label>
            <select
              name="id_patente"
              value={formData.id_patente}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 text-gray-900 shadow-sm"
            >
              <option value="" disabled hidden>
                Selecione a patente...
              </option>
              {patentes.map((patente) => (
                <option key={patente.id_patente} value={patente.id_patente}>
                  {patente.nome_patente.toUpperCase()}
                </option>
              ))}
            </select>
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

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../services/api";

// export default function AdminCreateUser() {
//   const navigate = useNavigate();

//   // Estados do formulário, incluindo o novo campo 'telefone'
//   const [formData, setFormData] = useState({
//     nome: "",
//     nome_guerra: "",
//     cpf: "",
//     matricula: "",
//     email: "",
//     password: "",
//     telefone: "",
//   });
//   const [status, setStatus] = useState({ type: "", message: "" });

//   // ================= MÁSCARAS =================
//   const handleNomeChange = (e) => {
//     let value = e.target.value;
//     value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
//     value = value.replace(/\s{2,}/g, " ");
//     value = value.replace(/^\s+/g, "");
//     setFormData({ ...formData, nome: value });
//   };

//   const handleNomeGuerraChange = (e) => {
//     let value = e.target.value;
//     value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
//     value = value.replace(/\s{2,}/g, " ");
//     value = value.replace(/^\s+/g, "");
//     setFormData({ ...formData, nome_guerra: value });
//   };

//   const handleCpfChange = (e) => {
//     let value = e.target.value.replace(/\D/g, "");
//     if (value.length > 11) value = value.substring(0, 11);
//     value = value.replace(/(\d{3})(\d)/, "$1.$2");
//     value = value.replace(/(\d{3})(\d)/, "$1.$2");
//     value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
//     setFormData({ ...formData, cpf: value });
//   };

//   const handleMatriculaChange = (e) => {
//     let value = e.target.value.replace(/\D/g, "");
//     if (value.length > 12) value = value.substring(0, 12);
//     value = value.replace(/(\d{10})(\d)/, "$1-$2");
//     setFormData({ ...formData, matricula: value });
//   };

//   const handleTelefoneChange = (e) => {
//     let value = e.target.value.replace(/\D/g, "");
//     if (value.length > 11) value = value.substring(0, 11);
//     value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
//     value = value.replace(/(\d)(\d{4})$/, "$1-$2");
//     setFormData({ ...formData, telefone: value });
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };
//   // ================= SUBMIT E VALIDAÇÕES =================
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Aplicação do Trim em todos os campos para evitar espaços extras
//     const payload = {
//       nome: formData.nome.trim(),
//       nome_guerra: formData.nome_guerra.trim(),
//       cpf: formData.cpf.trim(),
//       matricula: formData.matricula.trim(),
//       email: formData.email.trim(),
//       password: formData.password.trim(),
//       telefone: formData.telefone.trim(),
//     };

//     // Validação básica e efetiva de E-mail via Regex
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(payload.email)) {
//       setStatus({
//         type: "error",
//         message: "Por favor, insira um e-mail válido.",
//       });
//       return;
//     }

//     setStatus({ type: "loading", message: "A cadastrar usuário..." });

//     try {
//       await api.post("/admin/createuser", payload);

//       setStatus({
//         type: "success",
//         message: "Usuário cadastrado com sucesso!",
//       });

//       setFormData({
//         nome: "",
//         nome_guerra: "",
//         cpf: "",
//         matricula: "",
//         email: "",
//         password: "",
//         telefone: "",
//       });

//       setTimeout(() => {
//         navigate("/admin");
//       }, 2000);
//     } catch (error) {
//       console.error(error);
//       if (error.response?.status === 409) {
//         setStatus({
//           type: "error",
//           message: "Email, Matrícula ou CPF já cadastrado!",
//         });
//       } else if (error.response?.status === 403) {
//         setStatus({
//           type: "error",
//           message: "Preencha todos os campos obrigatórios!",
//         });
//       } else {
//         setStatus({
//           type: "error",
//           message: "Erro interno do servidor. Tente novamente.",
//         });
//       }
//     }
//   };

//   return (
//     <div className="py-10 px-4 sm:px-6 lg:px-8 flex justify-center w-full box-border overflow-hidden">
//       <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 sm:p-8 border-t-4 border-blue-500">
//         <div className="text-center mb-8">
//           <h2 className="text-2xl font-bold text-gray-900">Novo Usuário</h2>
//           <p className="text-sm text-gray-600">
//             Cadastro de perfil comum (Operacional)
//           </p>
//         </div>

//         {status.message && (
//           <div
//             className={`mb-4 p-3 rounded text-sm text-center font-medium ${
//               status.type === "success"
//                 ? "bg-green-100 text-green-700"
//                 : status.type === "error"
//                   ? "bg-red-100 text-red-700"
//                   : "bg-blue-100 text-blue-700"
//             }`}
//           >
//             {status.message}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4 w-full">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Nome Completo
//             </label>
//             <input
//               type="text"
//               name="nome"
//               value={formData.nome}
//               onChange={handleNomeChange}
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Nome de Guerra
//             </label>
//             <input
//               type="text"
//               name="nome_guerra"
//               value={formData.nome_guerra}
//               onChange={handleNomeGuerraChange}
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               CPF
//             </label>
//             <input
//               type="text"
//               name="cpf"
//               value={formData.cpf}
//               onChange={handleCpfChange}
//               placeholder="000.000.000-00"
//               maxLength={14}
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Matrícula
//             </label>
//             <input
//               type="text"
//               name="matricula"
//               value={formData.matricula}
//               onChange={handleMatriculaChange}
//               placeholder="0000000000-00"
//               maxLength={13}
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Telefone
//             </label>
//             <input
//               type="text"
//               name="telefone"
//               value={formData.telefone}
//               onChange={handleTelefoneChange}
//               placeholder="(00) 00000-0000"
//               maxLength={15}
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               E-mail
//             </label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               placeholder="exemplo@email.com"
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">
//               Senha Padrão
//             </label>
//             <input
//               type="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div className="flex flex-col sm:flex-row gap-4 mt-6">
//             <button
//               type="button"
//               onClick={() => navigate("/admin")}
//               className="w-full sm:w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
//             >
//               Cancelar
//             </button>
//             <button
//               type="submit"
//               disabled={status.type === "loading"}
//               className="w-full sm:w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
//             >
//               {status.type === "loading" ? "A Salvar..." : "Cadastrar Usuário"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

