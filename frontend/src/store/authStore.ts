import { create } from 'zustand';
import axios from '../lib/axios';

type User = {
  name: string;
  email: string;
  avatarUrl?: string;
};

type AuthStore = {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem('token'),
  user: null,

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },

  fetchUser: async () => {
    try {
      const res = await axios.get('/user/me'); // /api/user
      set({ user: res.data });
    } catch (err) {
      console.error('Failed to fetch user', err);
      set({ user: null });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
}));
