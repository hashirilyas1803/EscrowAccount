import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  user: {
    id: number | null;
    role: 'builder' | 'admin' | 'buyer' | null;
  } | null;
}

interface AuthContextType extends AuthState {
  login: (userData: any, role: 'user' | 'buyer') => void;
  logout: () => void;
  checkLoginStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    user: null,
  });

  const checkLoginStatus = () => {
    const user = sessionStorage.getItem('user');
    if (user) {
      setAuth({ isLoggedIn: true, user: JSON.parse(user) });
    } else {
      setAuth({ isLoggedIn: false, user: null });
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const login = (userData: any, type: 'user' | 'buyer') => {
    const userToStore = type === 'user' 
      ? { id: userData.user_id, role: userData.role }
      : { id: userData.buyer_id, role: 'buyer' };
      
    sessionStorage.setItem('user', JSON.stringify(userToStore));
    setAuth({ isLoggedIn: true, user: userToStore });
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    setAuth({ isLoggedIn: false, user: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, checkLoginStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};