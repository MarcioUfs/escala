import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AdminSignUp() {
  const navigate = useNavigate();
  
  // Estado que espelha os dados exigidos pelo seu backend
  const [formData, setFormData] = useState({
    nome: '',
    password: '',
    cpf: '',
    email: '',
    matricula: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'A registar administrador...' });

    try {
      // Faz o POST para a rota de criação de admin no backend
      await api.post('/admin/sign-up', formData);
      
      setStatus({ type: 'success', message: 'Administrador registado com sucesso!' });
      
      // Limpa os campos do formulário
      setFormData({ nome: '', password: '', cpf: '', email: '', matricula: '' });
      
      // Retorna ao painel de administração após 2 segundos
      setTimeout(() => {
        navigate('/admin');
      }, 2000);

    } catch (error) {
      console.error(error);
      setStatus({ 
        type: 'error', 
        message: 'Erro no registo. Verifique os dados ou se o CPF/Matrícula já existem.' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Novo Administrador</h2>
          <p className="text-sm text-gray-600">Preencha os dados para registar no sistema</p>
        </div>

        {status.message && (
          <div className={`mb-4 p-3 rounded text-sm text-center ${
            status.type === 'success' ? 'bg-green-100 text-green-700' : 
            status.type === 'error' ? 'bg-red-100 text-red-700' : 
            'bg-blue-100 text-blue-700'
          }`}>
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
              placeholder="Apenas números ou formato 000.000.000-00"
              value={formData.cpf}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Matrícula</label>
            <input
              type="text"
              name="matricula"
              value={formData.matricula}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
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
            <label className="block text-sm font-medium text-gray-700">Senha</label>
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
              onClick={() => navigate('/admin')}
              className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={status.type === 'loading'}
              className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none disabled:opacity-50"
            >
              {status.type === 'loading' ? 'A guardar...' : 'Registar Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}