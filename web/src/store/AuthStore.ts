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
  
  // Actions
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

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