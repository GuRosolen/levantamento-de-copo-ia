import axios from 'axios';

// Lê a URL do backend a partir de variáveis de ambiente do Vite (essencial para Vercel Cloud)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para injetar o Token JWT automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Endpoints de Autenticação
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

// Endpoints de Consumo e Metas individuais por Usuário
export const getDailySummary = async (userId, date) => {
  const response = await api.get(`/users/${userId}/daily-summary`, {
    params: { date }
  });
  return response.data;
};

export const addLog = async (log) => {
  // O backend preenche o userId a partir das claims do Token JWT, mas enviamos no objeto também
  const response = await api.post('/macro-logs', log);
  return response.data;
};

export const deleteLog = async (id) => {
  await api.delete(`/macro-logs/${id}`);
};

export const updateGoal = async (userId, goal) => {
  const response = await api.post(`/users/${userId}/goals`, goal);
  return response.data;
};

export const getDashboard = async (userId, period, startDate, endDate) => {
  const response = await api.get(`/users/${userId}/dashboard`, {
    params: { period, startDate, endDate }
  });
  return response.data;
};

export const estimateMacros = async (description) => {
  const response = await api.post('/ai/estimate-macros', { description });
  return response.data;
};

export const getAiConfig = async () => {
  const response = await api.get('/ai/config');
  return response.data;
};
