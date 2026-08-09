import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";

export default function AdminLogin() {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { signIn, signOut } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 1. Enviamos o 'cpf' (com pontos e traço) e apontamos para '/admin/login'
      const role = await signIn(cpf, password, "/admin/login");

      // 2. Barreira de Segurança
      if (role !== "admin") {
        signOut(false); // Limpa o token e não redireciona
        setError(
          "Acesso negado. Este portal é exclusivo para Administradores.",
        );
        return;
      }

      // 3. Sucesso! Vai para o Dashboard do Admin
      navigate("/admin");
    } catch (err) {
      // Se o backend recusar (senha errada ou CPF não encontrado), cai aqui
      setError("Falha na autenticação do Admin. Verifique CPF e senha.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Visualmente diferente (fundo escuro) para o admin saber que está no lugar certo */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Acesso Restrito
        </h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Portal do Administrador
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              CPF do Admin
            </label>
            <input
              type="text"
              value={cpf}
              onChange={handleCpfChange}
              maxLength={14}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 text-white bg-blue-800 hover:bg-blue-900 rounded-md shadow-sm font-medium"
          >
            Entrar no Painel
          </button>
        </form>
      </div>
    </div>
  );
}
