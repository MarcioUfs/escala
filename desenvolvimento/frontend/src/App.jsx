import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";

import AdminLayout from "./layouts/AdminLayout";
import UserLayout from "./layouts/UserLayout";

import Home from "./pages/home/Home";
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
import AdminCreateEscala from "./pages/admin/AdminCreateEscala";
import AdminEscala from "./pages/admin/AdminEscala";
import AdminPermutas from "./pages/admin/AdminPermutas";
import UserEscala from "./pages/user/UserEscala";
import UserPermutas from "./pages/user/UserPermutas";

function App() {
  return (
    <BrowserRouter useTransitions={false}>
      <AuthProvider>
        <Routes>
          {/* ==============================================
              PÁGINA INICIAL PÚBLICA
             ============================================== */}
          <Route path="/" element={<Home />} />

          {/* ==============================================
              ROTAS PÚBLICAS DE LOGIN
             ============================================== */}
          <Route path="/login-admin" element={<AdminLogin />} />
          <Route path="/login" element={<Login />} />

          {/* ==============================================
              ROTAS PROTEGIDAS - ADMIN
             ============================================== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="sign-up" element={<AdminSignUp />} />
            <Route path="users" element={<AdminListUsers />} />
            <Route path="edit-user" element={<AdminEditUser />} />
            <Route path="view-user" element={<AdminViewUser />} />
            <Route path="view-admin" element={<AdminViewAdmin />} />
            <Route path="create-user" element={<AdminCreateUser />} />
            <Route path="admins" element={<AdminListAdmins />} />
            <Route path="create-escala" element={<AdminCreateEscala />} />
            <Route path="escala" element={<AdminEscala />} />
            <Route path="permutas" element={<AdminPermutas />} />
          </Route>

          {/* ==============================================
              ROTAS PROTEGIDAS - USER
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
            <Route path="escala" element={<UserEscala />} />
            <Route path="permutas" element={<UserPermutas />} />
          </Route>

          {/* REDIRECIONAMENTO PADRÃO -> agora vai pra Home, não mais pro login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;