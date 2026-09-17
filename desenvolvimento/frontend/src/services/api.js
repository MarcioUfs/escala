import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.56.1:3000',
  // baseURL: 'http://localhost:3000',
});

// Interceptor: Antes de enviar qualquer requisição, anexa o token se ele existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@App:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta: um 429 (limite de requisições) pode acontecer em
// qualquer tela, então em vez de cada componente tratar isso na mão, dispara
// um evento global que o <RateLimitModal /> (montado uma vez em App.jsx)
// escuta e mostra o aviso — funciona não importa em qual página o admin
// estiver no momento do bloqueio.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const retryAfterSeconds = Number(error.response.data?.retryAfterSeconds) || 300;
      window.dispatchEvent(new CustomEvent('api:rate-limited', { detail: { retryAfterSeconds } }));
    }
    return Promise.reject(error);
  },
);

export default api;

/*
 ➜  Local:   http://localhost:5173/   
  ➜  Network: http://192.168.56.1:5173/
  ➜  essa aqui Network: http://192.168.100.14:5173/
*/