import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import RateLimitModal from "./components/RateLimitModal";

// Code-splitting por rota (Q5): cada página só é baixada quando a rota é
// visitada, em vez de tudo entrar de uma vez no bundle inicial. Layouts
// também são lazy -- só carregam junto da primeira página de cada área.
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const UserLayout = lazy(() => import("./layouts/UserLayout"));
const MasterLayout = lazy(() => import("./layouts/MasterLayout"));

const Home = lazy(() => import("./pages/home/Home"));
const Login = lazy(() => import("./pages/user/Login"));
const UserDashboard = lazy(() => import("./pages/user/UserDashboard"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSignUp = lazy(() => import("./pages/admin/AdminSignUp"));
const AdminCreateUser = lazy(() => import("./pages/user/AdminCreateUser"));
const AdminListUsers = lazy(() => import("./pages/user/AdminListUsers"));
const AdminEditUser = lazy(() => import("./pages/user/AdminEditUser"));
const AdminViewUser = lazy(() => import("./pages/user/AdminViewUser"));
const UserResetPassword = lazy(() => import("./pages/user/UserResetPassword"));
const AdminListAdmins = lazy(() => import("./pages/admin/AdminListAdmins"));
const AdminViewAdmin = lazy(() => import("./pages/admin/AdminViewAdmin"));
const AdminEditAdmin = lazy(() => import("./pages/admin/AdminEditAdmin"));
const AdminCreateEscala = lazy(() => import("./pages/admin/AdminCreateEscala"));
const AdminEscala = lazy(() => import("./pages/admin/AdminEscala"));
const AdminPermutas = lazy(() => import("./pages/admin/AdminPermutas"));
const AdminAfastamentos = lazy(() => import("./pages/admin/AdminAfastamentos"));
const AdminImportarAntiguidade = lazy(() => import("./pages/admin/AdminImportarAntiguidade"));
const AdminMeusDados = lazy(() => import("./pages/admin/AdminMeusDados"));
const AdminBoletimEfetivo = lazy(() => import("./pages/admin/AdminBoletimEfetivo"));
const AdminEscalaDespachantes = lazy(() => import("./pages/admin/AdminEscalaDespachantes"));
const AdminEscalasConsolidadas = lazy(() => import("./pages/admin/AdminEscalasConsolidadas"));
const UserEscala = lazy(() => import("./pages/user/UserEscala"));
const UserPermutas = lazy(() => import("./pages/user/UserPermutas"));
const UserBoletins = lazy(() => import("./pages/user/UserBoletins"));
const MasterLogin = lazy(() => import("./pages/master/MasterLogin"));
const MasterAdmins = lazy(() => import("./pages/master/MasterAdmins"));
const MasterViewAdmin = lazy(() => import("./pages/master/MasterViewAdmin"));
const MasterEditAdmin = lazy(() => import("./pages/master/MasterEditAdmin"));

// Fallback simples enquanto o chunk da rota carrega -- só aparece de
// verdade numa conexão lenta ou no primeiro acesso a cada área.
function CarregandoPagina() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Carregando...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter useTransitions={false}>
      <AuthProvider>
        <RateLimitModal />
        <Suspense fallback={<CarregandoPagina />}>
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

            {/* Login do master: de propósito não há link para cá em lugar
                nenhum do sistema — chega quem souber o endereço. */}
            <Route path="/login-master" element={<MasterLogin />} />

            {/* ==============================================
                ROTAS PROTEGIDAS - MASTER
               ============================================== */}
            <Route
              path="/master"
              element={
                <ProtectedRoute allowedRoles={["master"]}>
                  <MasterLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MasterAdmins />} />
              <Route path="view-admin" element={<MasterViewAdmin />} />
              <Route path="edit-admin" element={<MasterEditAdmin />} />
            </Route>

            {/* ==============================================
                ROTAS PROTEGIDAS - ADMIN
                O master entra aqui também: faz tudo que o admin faz.
               ============================================== */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin", "master"]}>
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
              <Route path="edit-admin" element={<AdminEditAdmin />} />
              <Route path="create-user" element={<AdminCreateUser />} />
              <Route path="admins" element={<AdminListAdmins />} />
              <Route path="create-escala" element={<AdminCreateEscala />} />
              <Route path="escala" element={<AdminEscala />} />
              <Route path="permutas" element={<AdminPermutas />} />
              <Route path="afastamentos" element={<AdminAfastamentos />} />
              <Route path="importar-antiguidade" element={<AdminImportarAntiguidade />} />
              <Route path="meus-dados" element={<AdminMeusDados />} />
              <Route path="boletim-efetivo" element={<AdminBoletimEfetivo />} />
              <Route path="escala-despachantes" element={<AdminEscalaDespachantes />} />
              <Route path="escalas-consolidadas" element={<AdminEscalasConsolidadas />} />
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
              <Route path="boletins" element={<UserBoletins />} />
            </Route>

            {/* REDIRECIONAMENTO PADRÃO -> agora vai pra Home, não mais pro login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
