import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { signed, user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  // Se não estiver logado, manda pro Login
  if (!signed) {
    return <Navigate to="/login" replace />;
  }

  // Se a rota exige um perfil específico e o usuário não possui
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redireciona para uma rota segura (dashboard padrão do perfil)
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'user') return <Navigate to="/user" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};