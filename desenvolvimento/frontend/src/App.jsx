import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";

import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';

import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSignUp from "./pages/AdminSignUp";
import UserDashboard from "./pages/UserDashboard";
import AdminCreateUser from "./pages/AdminCreateUser";
import AdminListUsers from "./pages/AdminListUsers";
import AdminEditUser from "./pages/AdminEditUser";
import AdminViewUser from "./pages/AdminViewUser";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ROTAS PÚBLICAS DE LOGIN */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ==============================================
              ROTAS PROTEGIDAS - ADMIN 
              O AdminLayout abraça todas as telas administrativas
              ============================================== */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* O 'index' é a tela que abre quando acessa exatamente '/admin' */}
            <Route index element={<AdminDashboard />} />
            
            {/* As rotas abaixo juntam com '/admin'. Ex: '/admin/sign-up' */}
            <Route path="sign-up" element={<AdminSignUp />} />
            <Route path="users" element={<AdminListUsers />} />
            <Route path="edit-user" element={<AdminEditUser />} />
            <Route path="view-user" element={<AdminViewUser />} />
            <Route path="create-user" element={<AdminCreateUser />} />
          </Route>

          {/* ==============================================
              ROTAS PROTEGIDAS - USER 
              O UserLayout abraça as telas operacionais
              ============================================== */}
          <Route 
            path="/user" 
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserDashboard />} />
          </Route>

          {/* REDIRECIONAMENTO PADRÃO */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;