import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profilePic?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateRole: (role: string) => void;
  updateProfilePic: (dataUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('vexintel_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const persistUser = (u: User) => {
    localStorage.setItem('vexintel_user', JSON.stringify(u));
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 800));
    if (!email || password.length < 4) throw new Error('Invalid credentials');
    const u: User = { id: crypto.randomUUID(), email, name: email.split('@')[0], role: 'SDR' };
    persistUser(u);
  };

  const signup = async (email: string, password: string, name: string) => {
    await new Promise(r => setTimeout(r, 1000));
    if (!email || password.length < 6) throw new Error('Password must be at least 6 characters');
    if (!name.trim()) throw new Error('Name is required');
    const u: User = { id: crypto.randomUUID(), email, name, role: '' };
    persistUser(u);
  };

  const logout = () => {
    localStorage.removeItem('vexintel_user');
    setUser(null);
  };

  const updateRole = (role: string) => {
    if (user) {
      const updated = { ...user, role };
      persistUser(updated);
    }
  };

  const updateProfilePic = (profilePic: string) => {
    if (user) {
      const updated = { ...user, profilePic };
      persistUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateRole, updateProfilePic }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
