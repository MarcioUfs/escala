import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ChangePassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação de UX: Verifica se as senhas batem antes de enviar ao servidor
    if (formData.newPassword !== formData.confirmNewPassword) {
      setStatus({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    setStatus({ type: 'loading', message: 'A processar atualização...' });

    try {
      await api.put('/updatePassword', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword
      });

      setStatus({ type: 'success', message: 'Senha atualizada com sucesso!' });
      
      // Limpa o formulário por segurança após o sucesso
      setFormData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });

      // Retorna à tela anterior ou painel após 2 segundos
      setTimeout(() => {
        navigate(-1); 
      }, 2000);

    } catch (error) {
      console.error(error);
      
      // Regra 5: Captura a mensagem específica do backend (se existir na resposta)
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      console.log(formData.newPassword === formData.oldPassword);
      
      if (backendMessage) {
        setStatus({ type: 'error', message: backendMessage });
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        setStatus({ type: 'error', message: 'A senha atual está incorreta.' });
      } else if (formData.oldPassword === formData.newPassword) {
        setStatus({ type: 'error', message: 'A nova senha não pode ser igual à senha atual.' });
      } else if (error.response?.status === 400) {
        setStatus({ type: 'error', message: 'Preencha todos os campos corretamente.' });
      } else {
        setStatus({ type: 'error', message: 'Erro interno do servidor. Tente novamente mais tarde.' });
      }
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
      {/* Container responsivo usando o mesmo padrão de borda amarela */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-8 border-t-4 border-yellow-500">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Alterar Senha</h2>
          <p className="text-sm text-gray-600">Atualize suas credenciais de acesso</p>
        </div>

        {/* Feedback visual de Sucesso, Erro ou Loading */}
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
            <label className="block text-sm font-medium text-gray-700">Senha Atual</label>
            <input 
              type="password" 
              name="oldPassword" 
              value={formData.oldPassword} 
              onChange={handleChange} 
              required 
              placeholder="Digite a senha atual" 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
            <input 
              type="password" 
              name="newPassword" 
              value={formData.newPassword} 
              onChange={handleChange} 
              required 
              placeholder="Digite a nova senha" 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
            <input 
              type="password" 
              name="confirmNewPassword" 
              value={formData.confirmNewPassword} 
              onChange={handleChange} 
              required 
              placeholder="Repita a nova senha" 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500" 
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={status.type === 'loading'} 
              className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 transition disabled:opacity-50"
            >
              {status.type === 'loading' ? 'A Atualizar...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}