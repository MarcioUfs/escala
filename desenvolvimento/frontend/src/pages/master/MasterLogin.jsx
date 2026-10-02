import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";

// Portal do MASTER — não há link nem botão para cá em lugar nenhum do sistema:
// chega quem souber o endereço. Isso não é a proteção (quem protege é o login
// e o JWT com segredo próprio), é só para o acesso não ficar à mostra.
//
// Identidade visual vermelha, distinta do azul do admin, para deixar evidente
// em qual nível de poder a pessoa está operando.
export default function MasterLogin() {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [entrando, setEntrando] = useState(false);

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
    setEntrando(true);

    try {
      const role = await signIn(cpf, password, "/master/login");

      // Mesmo o backend só emitindo token de master nesta rota, a barreira
      // fica aqui também: token de outro perfil não abre este painel.
      if (role !== "master") {
        signOut(false);
        setError("Acesso negado. Este portal é exclusivo para o perfil master.");
        return;
      }

      navigate("/master");
    } catch (err) {
      setError("Falha na autenticação. Verifique CPF e senha.");
      console.error(err);
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border-t-4 border-red-600">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-red-100">
            <ShieldAlert className="text-red-600" size={28} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Acesso Master</h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Nível máximo de permissão do sistema
        </p>

        {error && (
          <p className="text-red-700 text-sm mb-4 text-center bg-red-50 border border-red-200 p-2 rounded">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <div className="relative mt-1">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={entrando}
            className="w-full py-2 px-4 text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 rounded-md shadow-sm font-semibold transition"
          >
            {entrando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
