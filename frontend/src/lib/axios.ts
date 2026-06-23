import axios from 'axios';
import { useAuthStore } from '../store/authStore';
const url = 'http://localhost:5000/api'
// const url = 'https://api.hostit.shriii.xyz/api'
// const url = "https://hostit-1.onrender.com/api"
const instance = axios.create({
  baseURL: url,
});

instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
