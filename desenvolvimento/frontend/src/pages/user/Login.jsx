import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function Login() {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mostrarEsqueciSenha, setMostrarEsqueciSenha] = useState(false);

  const { signIn, signOut } = useContext(AuthContext);
  const navigate = useNavigate();

  // Função que aplica a máscara de CPF automaticamente
  const handleCpfChange = (e) => {
    // Pega o valor digitado e remove tudo que não for número
    let value = e.target.value.replace(/\D/g, '');
    
    // Limita a quantidade máxima de números para 11 (tamanho de um CPF)
    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    // Aplica a formatação: 000.000.000-00
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    // Atualiza o estado com o valor formatado
    setCpf(value);
  };

const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // 1. Enviamos o 'cpf' (com pontos e traço) e apontamos para '/login'
      const role = await signIn(cpf, password, '/login');
      
      // 2. Se for admin, manda para o portal certo
      if (role === 'admin') {
        signOut(false); // Limpa o token e não redireciona
        setError('Administradores devem fazer login pelo portal restrito (/admin/login).');
        return;
      }

      // 3. Sucesso! Vai para o painel de usuário
      navigate('/user');
    } catch (err) {
      setError('Falha na autenticação. Verifique CPF e senha.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Acesso ao Sistema</h2>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14} // Tamanho máximo do CPF formatado
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Entrar
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMostrarEsqueciSenha(true)}
            className="block w-full text-center text-sm text-blue-600 hover:underline"
          >
            Esqueci minha senha
          </button>
        </form>
      </div>

      {mostrarEsqueciSenha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMostrarEsqueciSenha(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Esqueci minha senha</h3>
            <p className="text-sm text-gray-600 mb-5">
              Entre em contato com o administrador para solucionar o problema.
            </p>
            <button
              type="button"
              onClick={() => setMostrarEsqueciSenha(false)}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}