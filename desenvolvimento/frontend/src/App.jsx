import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";

import AdminLayout from "./layouts/AdminLayout";
import UserLayout from "./layouts/UserLayout";

import Login from "./pages/user/Login";
import UserDashboard from "./pages/user/UserDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSignUp from "./pages/admin/AdminSignUp";
import AdminCreateUser from "./pages/user/AdminCreateUser";
import AdminListUsers from "./pages/user/AdminListUsers";
import AdminEditUser from "./pages/user/AdminEditUser";
import AdminViewUser from "./pages/user/AdminViewUser";
import UserResetPassword from "./pages/user/UserResetPassword";
import AdminListAdmins from "./pages/admin/AdminListAdmins";
import AdminViewAdmin from "./pages/admin/AdminViewAdmin";
import DashboardEscalas from "./pages/escala/DashboardEscala";
import EscalaEdit from "./pages/escala/EscalaEdit";

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
            <Route path="view-admin" element={<AdminViewAdmin />} />
            <Route path="create-user" element={<AdminCreateUser />} />
            <Route path="admins" element={<AdminListAdmins />} />
            <Route path="escalas" element={<DashboardEscalas />} />
            <Route path="edit-escala" element={<EscalaEdit />} />
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
            <Route path="reset-password" element={<UserResetPassword />} />
          </Route>

          {/* REDIRECIONAMENTO PADRÃO */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
