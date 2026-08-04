// import { useContext } from 'react';
// import { Navigate } from 'react-router-dom';
// import { AuthContext } from '../contexts/AuthContext';

// export const ProtectedRoute = ({ children, allowedRoles }) => {
//   const { signed, user, loading } = useContext(AuthContext);

//   if (loading) {
//     return <div className="flex h-screen items-center justify-center">Carregando...</div>;
//   }

//   // Se não estiver logado, manda pro Login
//   if (!signed) {
//     return <Navigate to="/login" replace />;
//   }

//   // Se a rota exige um perfil específico e o usuário não possui
//   if (allowedRoles && !allowedRoles.includes(user?.role)) {
//     // Redireciona para uma rota segura (dashboard padrão do perfil)
//     if (user?.role === 'admin') return <Navigate to="/admin" replace />;
//     if (user?.role === 'user') return <Navigate to="/user" replace />;
//     return <Navigate to="/" replace />;
//   }

//   return children;
// };

// import { useContext } from 'react';
// import { Navigate } from 'react-router-dom';
// import { AuthContext } from '../contexts/AuthContext';

// export const ProtectedRoute = ({ children, allowedRoles }) => {
//   const { signed, user, loading } = useContext(AuthContext);

//   if (loading) {
//     return <div className="flex h-screen items-center justify-center">Carregando...</div>;
//   }

//   // 1. Se não estiver logado, manda pro Login
//   if (!signed) {
//     return <Navigate to="/login" replace />;
//   }

//   // 2. Se o perfil do usuário não estiver na lista permitida
//   if (allowedRoles && !allowedRoles.includes(user?.role)) {
//     // Aponta para as telas principais de cada perfil (evitando loop)
//     const fallbackPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
//     return <Navigate to={fallbackPath} replace />;
//   }

//   return children;
// };

import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { signed, user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  // 1. Se não estiver logado, manda pro login público
  if (!signed) {
    return <Navigate to="/login" replace />;
  }

  // 2. Se o perfil não estiver autorizado
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redireciona para o dashboard correto do perfil logado (evita loop na rota atual)
    const destination = user?.role === 'admin' ? '/admin' : '/user';
    return <Navigate to={destination} replace />;
  }

  return children;
};