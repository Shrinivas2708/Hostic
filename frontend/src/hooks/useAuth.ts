// src/hooks/useAuth.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { isAxiosError } from 'axios';

type AuthPayload = {
  email?: string;
  userName: string;
  password: string;
};

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setToken, fetchUser } = useAuthStore();
  const navigate = useNavigate();

  const login = async ({ userName, password }: AuthPayload) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/auth/login', { username:userName, password });
      const token = res.data.token;
      setToken(token);
      await fetchUser();
      navigate('/dashboard');
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Login failed');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async ({ userName, email, password }: AuthPayload) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/auth/signup', { username:userName, email, password });
      const token = res.data.token;
      setToken(token);
      await fetchUser();
      navigate('/dashboard');
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Signup failed');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    signup,
    loading,
    error,
  };
};
