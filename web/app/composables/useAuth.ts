// Authentication composable

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthData {
  user: User;
  token: string;
  refreshToken: string;
}

export function useAuth() {
  const api = useApi();
  const user = useState<User | null>('auth_user', () => null);
  const isAuthenticated = computed(() => !!user.value);

  const setAuth = (authData: AuthData) => {
    user.value = authData.user;
    if (import.meta.client) {
      localStorage.setItem('auth_token', authData.token);
      localStorage.setItem('refresh_token', authData.refreshToken);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthData>('/auth/login', { email, password });
    setAuth(response);
    return response;
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await api.post<AuthData>('/auth/register', { email, password, name });
    setAuth(response);
    return response;
  };

  const logout = () => {
    user.value = null;
    if (import.meta.client) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
    navigateTo('/login');
  };

  const fetchUser = async () => {
    try {
      const response = await api.get<{ user: User }>('/auth/me');
      user.value = response.user;
      return response.user;
    } catch {
      logout();
      return null;
    }
  };

  const initAuth = async () => {
    if (import.meta.client) {
      const token = localStorage.getItem('auth_token');
      if (token && !user.value) {
        await fetchUser();
      }
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
    initAuth,
  };
}
