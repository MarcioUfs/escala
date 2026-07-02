import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.56.1:3000',
  // baseURL: 'http://localhost:3000',
});

// Interceptor: Antes de enviar qualquer requisição, anexa o token se ele existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@App:tokenUser');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

/*
 ➜  Local:   http://localhost:5173/   
  ➜  Network: http://192.168.56.1:5173/
  ➜  essa aqui Network: http://192.168.100.14:5173/
*/