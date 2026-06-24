import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { config } from './config';

const instance = axios.create({
  baseURL: config.apiUrl,
});

instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
