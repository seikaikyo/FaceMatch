import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (username: string, password: string) => {
    console.log('authStore.login called with:', { username, password });
    set({ isLoading: true });
    try {
      const { user, token } = await authService.login({ username, password });
      console.log('authService.login successful:', { user, token });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('authService.login failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    if (!authService.isAuthenticated()) {
      return;
    }
    
    set({ isLoading: true });
    try {
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (userData: Partial<User>) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...userData } });
    }
  },
}));