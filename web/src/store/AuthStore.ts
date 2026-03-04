import { create } from "zustand";
import api from "../lib/axios"; 

interface User {
  id: string;
  username: string;
  full_name: string;
  account: {
    balance: string;
  };
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  remember:boolean;
  
  setRemember: (value: boolean) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  remember: false,
  setRemember: (value: boolean) => set({ remember: value }),
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user, 
    isLoading: false 
  }),

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get("/api/user");
      set({ user: res.data, isAuthenticated: true });
    } catch (err) {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post("/api/auth/web/logout");
    } finally {
      set({ user: null, isAuthenticated: false });
      window.location.href = "/login";
    }
  },
}));

export default useAuthStore;