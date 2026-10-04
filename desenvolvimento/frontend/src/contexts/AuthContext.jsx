// import { createContext, useState, useEffect } from "react";
// import api from "../services/api";

// export const AuthContext = createContext({});

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // 1. O que acontece quando o usuário atualiza a página (F5)
//   useEffect(() => {
//     const loadStorageData = async () => {
//       const storedToken = localStorage.getItem("@App:token");
//       const storedRole = localStorage.getItem("@App:userRole"); // Lembrete do perfil

//       if (storedToken && storedRole) {
//         try {
//           api.defaults.headers.Authorization = `Bearer ${storedToken}`;

//           // Decide qual rota bater baseado no lembrete
//           const profileRoute =
//             storedRole === "admin" ? "/admin/getadmin" : "/getUser";

//           const response = await api.get(profileRoute);
//           setUser(response.data);
//         } catch (error) {
//           console.error("Token expirado ou inválido. Deslogando...", error);
//           localStorage.removeItem("@App:token");
//           localStorage.removeItem("@App:userRole");
//         }
//       }
//       setLoading(false);
//     };

//     loadStorageData();
//   }, []);

//   // 2. O que acontece na hora do Login
//   const signIn = async (cpf, password, apiRoute = "/login") => {
//     try {
//       // Passo A: Faz o login
//       const response = await api.post(apiRoute, { cpf, password });
//       const tokenRecebido = response.data.token || response.data.token;

//       if (!tokenRecebido) {
//         throw new Error("O backend não enviou o token!");
//       }

//       localStorage.setItem("@App:token", tokenRecebido);
//       api.defaults.headers.Authorization = `Bearer ${tokenRecebido}`;

//       // Passo B: Decide onde buscar os dados baseado na rota de login que foi usada
//       const profileRoute =
//         apiRoute === "/admin/login" ? "/admin/getadmin" : "/getUser";

//       // Passo C: Puxa os dados da rota correta
//       const userProfileResponse = await api.get(profileRoute);

//       // Se o seu backend retornar os dados dentro de um array (ex: response.data[0]), ajustamos aqui:
//       const userData = Array.isArray(userProfileResponse.data)
//         ? userProfileResponse.data[0]
//         : userProfileResponse.data;

//       // Passo D: Salva o lembrete da role para usar no F5
//       localStorage.setItem("@App:userRole", userData.role);

//       setUser(userData);

//       return userData.role;
//     } catch (error) {
//       console.error("Erro no fluxo de autenticação:", error);
//       throw error;
//     }
//   };

//   // 3. O que acontece no Logout
//   const signOut = () => {
//     localStorage.removeItem("@App:token");
//     localStorage.removeItem("@App:userRole");
//     api.defaults.headers.Authorization = null;
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{ signed: !!user, user, signIn, signOut, loading }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

import { createContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const AuthContext = createContext({});

// Cada perfil busca o próprio cadastro numa rota diferente — tabelas
// distintas (users, admins, masters) e segredos de JWT distintos.
const ROTA_PERFIL_POR_PAPEL = {
  admin: "/admin/getadmin",
  master: "/master/me",
  user: "/getUser",
};

const ROTA_PERFIL_POR_LOGIN = {
  "/admin/login": "/admin/getadmin",
  "/master/login": "/master/me",
  "/login": "/getUser",
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadStorageData = async () => {
      const storedToken = localStorage.getItem("@App:token");
      const storedRole = localStorage.getItem("@App:userRole");

      if (storedToken && storedRole) {
        try {
          api.defaults.headers.Authorization = `Bearer ${storedToken}`;

          const profileRoute = ROTA_PERFIL_POR_PAPEL[storedRole] || "/getUser";

          const response = await api.get(profileRoute);
          setUser(response.data);
        } catch (error) {
          console.error("Token expirado ou inválido. Deslogando...", error);
          localStorage.removeItem("@App:token");
          localStorage.removeItem("@App:userRole");
        }
      }
      setLoading(false);
    };

    loadStorageData();
  }, []);

  const signIn = async (cpf, password, apiRoute = "/login") => {
    try {
      const response = await api.post(apiRoute, { cpf, password });
      const tokenRecebido = response.data.token || response.data.tokenUser;

      if (!tokenRecebido) {
        throw new Error("O backend não enviou o token!");
      }

      localStorage.setItem("@App:token", tokenRecebido);
      api.defaults.headers.Authorization = `Bearer ${tokenRecebido}`;

      const profileRoute = ROTA_PERFIL_POR_LOGIN[apiRoute] || "/getUser";

      const userProfileResponse = await api.get(profileRoute);

      const userData = Array.isArray(userProfileResponse.data)
        ? userProfileResponse.data[0]
        : userProfileResponse.data;

      localStorage.setItem("@App:userRole", userData.role);
      setUser(userData);

      return userData.role;
    } catch (error) {
      console.error("Erro no fluxo de autenticação:", error);
      throw error;
    }
  };

  // Atualiza campos do usuário já logado sem precisar de um novo GET/login
  // -- usado depois da troca de senha obrigatória (S4), pra desligar
  // mustChangePassword na hora sem esperar um F5.
  const updateUser = (campos) => {
    setUser((atual) => (atual ? { ...atual, ...campos } : atual));
  };

  // `redirect = true` por padrão: logout "de verdade" manda pra Home.
  // Passe `signOut(false)` quando quiser só limpar a sessão sem navegar
  // (ex: usuário tentou logar no portal errado e você quer mostrar um erro na mesma tela).
  const signOut = (redirect = true) => {
    localStorage.removeItem("@App:token");
    localStorage.removeItem("@App:userRole");
    api.defaults.headers.Authorization = null;
    setUser(null);

    if (redirect) {
      navigate("/");
    }
  };

  // Ref em vez de depender direto de `signOut` no useEffect abaixo: assim
  // o listener é registrado uma única vez (não numa função nova a cada
  // render), mas sempre chama a versão mais atual de signOut. Atualizada
  // num efeito (não durante o render) porque mexer em ref.current fora
  // de evento/efeito quebra a regra do React.
  const signOutRef = useRef(signOut);
  useEffect(() => {
    signOutRef.current = signOut;
  });

  // Reage a um 401 com tokenError:true vindo de QUALQUER chamada da API
  // (o interceptor de api.js dispara esse evento) — sessão expirada ou
  // token inválido no meio do uso agora encerra a sessão e volta pro
  // início automaticamente, em vez da tela continuar "logada" com as
  // chamadas falhando silenciosamente até um F5.
  useEffect(() => {
    function aoReceberTokenInvalido() {
      signOutRef.current();
    }
    window.addEventListener("api:unauthorized", aoReceberTokenInvalido);
    return () => window.removeEventListener("api:unauthorized", aoReceberTokenInvalido);
  }, []);

  return (
    <AuthContext.Provider
      value={{ signed: !!user, user, signIn, signOut, updateUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};