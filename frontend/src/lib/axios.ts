import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { config } from './config';
import { applyNgrokHeaders } from './ngrok';

const instance = axios.create({
  baseURL: config.apiUrl,
});

instance.interceptors.request.use((req) => {
  const token = useAuthStore.getState().token;
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  req.headers = req.headers ?? {};
  applyNgrokHeaders(req.headers as Record<string, string>, config.apiUrl);
  return req;
});

export default instance;
