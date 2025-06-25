import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Defines the shape of the user object and authentication state.
interface AuthState {
  isLoggedIn: boolean;
  user: {
    id: number | null;
    role: 'builder' | 'admin' | 'buyer' | null;
  } | null;
}

// Defines the context type, including state and actions.
interface AuthContextType extends AuthState {
  login: (userData: any, roleType: 'user' | 'buyer') => void;
  logout: () => void;
  checkLoginStatus: () => void;
}

// Create the context with an initial undefined value.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication state and actions to its children.
 * Manages user data in sessionStorage to persist across page reloads.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    user: null,
  });

  // Checks sessionStorage on initial load to restore login state.
  const checkLoginStatus = () => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setAuth({ isLoggedIn: true, user: JSON.parse(storedUser) });
    } else {
      setAuth({ isLoggedIn: false, user: null });
    }
  };

  // Run checkLoginStatus once when the component mounts.
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Sets user data in state and sessionStorage upon successful login.
  const login = (userData: any, type: 'user' | 'buyer') => {
    const userToStore = type === 'user' 
      ? { id: userData.user_id, role: userData.role }
      : { id: userData.buyer_id, role: 'buyer' };
      
    sessionStorage.setItem('user', JSON.stringify(userToStore));
    setAuth({ isLoggedIn: true, user: userToStore });
  };

  // Clears user data from state and sessionStorage upon logout.
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

/**
 * Custom hook for easy access to the authentication context.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};