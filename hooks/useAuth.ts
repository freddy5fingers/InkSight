
import { useState, useEffect, useCallback } from 'react';

type UserType = 'free' | 'premium' | null;

interface AuthState {
  user: UserType;
  isPremium: boolean;
  login: (type: 'free' | 'premium') => void;
  logout: () => void;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<UserType>(null);

  useEffect(() => {
    try {
      // Check local storage for saved user session
      const savedUser = localStorage.getItem('userType') as UserType;
      if (savedUser) {
        setUser(savedUser);
      } else {
        setUser('free'); // Default to free user
      }
    } catch (error) {
      console.error("Failed to access localStorage for auth:", error);
      // Default to free user if localStorage is inaccessible
      setUser('free');
    }
  }, []);

  const login = useCallback((type: 'free' | 'premium') => {
    try {
      localStorage.setItem('userType', type);
    } catch (error) {
      console.error("Failed to write to localStorage for auth:", error);
    }
    setUser(type);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('userType');
    } catch (error) {
      console.error("Failed to remove from localStorage for auth:", error);
    }
    setUser(null);
  }, []);

  return {
    user,
    isPremium: user === 'premium',
    login,
    logout,
  };
};
