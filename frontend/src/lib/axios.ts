import axios from 'axios';
import { useAuthStore } from '../store/authStore';
// const local = 'http://localhost:5000/api'
const dep = "https://hostit-1.onrender.com/api"
const instance = axios.create({
  baseURL: dep,
});

instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
