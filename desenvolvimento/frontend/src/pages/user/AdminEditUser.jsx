import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

export default function AdminEditUser() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const userToEdit = location.state?.user;

  // INICIALIZA O ESTADO JÁ COM OS DADOS (Se existirem)
  const [formData, setFormData] = useState({
    id: userToEdit?.id || '',
    nome: userToEdit?.nome || '',
    cpf: userToEdit?.cpf || '',
    matricula: userToEdit?.matricula || '',
    email: userToEdit?.email || '',
    password: '' // A senha sempre começa vazia
  });

  const [status, setStatus] = useState({ type: '', message: '' });

  // O useEffect agora SÓ serve para chutar o utilizador para fora
  // se ele acessar a tela sem dados (ex: digitando a URL direto)
  useEffect(() => {
    if (!userToEdit) {
      navigate('/admin/users');
    }
  }, [userToEdit, navigate]);

  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setFormData({ ...formData, cpf: value });
  };

  const handleMatriculaChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 12) value = value.substring(0, 12);
    value = value.replace(/(\d{10})(\d)/, '$1-$2');
    setFormData({ ...formData, matricula: value });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'A atualizar utilizador...' });

    try {
      // Seguindo o seu padrão, a rota deve ser parecida com esta. 
      // NOTA: Geralmente atualizações usam o método PUT, mas se o seu Express estiver a usar POST, altere 'api.put' para 'api.post'
      await api.put('/admin/updateuser', formData);
      
      setStatus({ type: 'success', message: 'Utilizador atualizado com sucesso!' });
      
      setTimeout(() => {
        navigate('/admin/users'); // Volta para a lista
      }, 2000);

    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        setStatus({ type: 'error', message: 'Email, Matrícula ou CPF já cadastrado em outra conta!' });
      } else if (error.response?.status === 400) {
        setStatus({ type: 'error', message: 'Preencha todos os campos, incluindo a senha.' });
      } else {
        setStatus({ type: 'error', message: 'Erro interno do servidor. Tente novamente.' });
      }
    }
  };

  if (!userToEdit) return null; // Evita erro rápido antes do useEffect agir

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
      {/* Borda amarela para indicar Edição */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-8 border-t-4 border-yellow-500">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Editar Utilizador</h2>
          <p className="text-sm text-gray-600">Atualize os dados de <span className="font-semibold">{userToEdit.nome}</span></p>
        </div>

        {status.message && (
          <div className={`mb-4 p-3 rounded text-sm text-center font-medium ${
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
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">CPF</label>
            <input type="text" name="cpf" value={formData.cpf} onChange={handleCpfChange} maxLength={14} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Matrícula</label>
            <input type="text" name="matricula" value={formData.matricula} onChange={handleMatriculaChange} maxLength={13} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nova Senha (obrigatório)</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Digite uma senha" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500" />
            <p className="text-xs text-gray-500 mt-1">O sistema exige confirmação de senha para salvar alterações.</p>
          </div>

          <div className="flex gap-4 mt-6">
            <button type="button" onClick={() => navigate('/admin/users')} className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={status.type === 'loading'} className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 transition disabled:opacity-50">
              {status.type === 'loading' ? 'A Salvar...' : 'Atualizar Dados'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}