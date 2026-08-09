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

import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const AuthContext = createContext({});

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

          const profileRoute =
            storedRole === "admin" ? "/admin/getadmin" : "/getUser";

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

      const profileRoute =
        apiRoute === "/admin/login" ? "/admin/getadmin" : "/getUser";

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

  return (
    <AuthContext.Provider
      value={{ signed: !!user, user, signIn, signOut, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};