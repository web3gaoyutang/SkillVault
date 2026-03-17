import { create } from 'zustand';
import { authAPI } from '../api/auth';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: { id: number; username: string; email: string; display_name?: string; avatar_url?: string } | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthState['user']) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  user: null,
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({ accessToken, refreshToken });
  },
  setUser: (user) => set({ user }),
  fetchUser: async () => {
    if (!get().accessToken) return;
    try {
      const user = await authAPI.getMe();
      set({ user: { id: user.id, username: user.username, email: user.email, display_name: user.display_name, avatar_url: user.avatar_url } });
    } catch {
      // Token might be expired
    }
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
