import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
} from 'react';
import api from '@/lib/api';

type Role = 'builder' | 'buyer' | 'admin';
export interface User { id: number; name: string; role: Role; }

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, role: Role) => {
    if (role === 'buyer') {
      // Buyer login
      const res = await api.post('/buyer/auth/login', { email, password });
      setUser({ id: res.data.buyer_id, name: res.data.name, role: 'buyer' });
    } else {
      // Builder/Admin login
      const res = await api.post('/auth/login', { email, password, role });
      setUser({ id: res.data.user_id, name: res.data.name, role: res.data.role });
    }
  };

  const logout = async () => {
    if (user?.role === 'buyer') {
      await api.post('/buyer/auth/logout');
    } else {
      await api.post('/auth/logout');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);