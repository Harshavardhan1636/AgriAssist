'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

type User = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  farmLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  isDemoUser?: boolean; // Added to distinguish demo users
};

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  isDemoUser: boolean; // Added to easily check if current user is demo user
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(true); // Default to demo mode

  useEffect(() => {
    // Check if Firebase auth is available
    if (!auth) {
      console.warn('Firebase auth not initialized. Running in demo mode only.');
      // Set up demo mode only
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          setIsDemoUser(parsedUser.isDemoUser === true);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        }
      } else {
        // Default to demo mode
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setIsDemoUser(true);
      }
      setIsLoading(false);
      return;
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          isDemoUser: false
        });
        setIsAuthenticated(true);
        setIsDemoUser(false);
      } else {
        // User is signed out
        // Check for stored authentication data (demo user)
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setToken(storedToken);
            setUser(parsedUser);
            setIsAuthenticated(true);
            // Check if this is a demo user
            setIsDemoUser(parsedUser.isDemoUser === true);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            // Clear invalid data
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
          }
        } else {
          // No user is signed in
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
          setIsDemoUser(true); // Default to demo mode
        }
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if this is a demo login
      if (email === 'demo@agriassist.com' && password === 'demo123') {
        // Demo user authentication
        const mockToken = 'mock-jwt-token-' + Date.now();
        const demoUser = {
          uid: 'demo-user-id',
          email: email,
          displayName: 'Demo User',
          farmLocation: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'Bangalore, Karnataka, India'
          },
          isDemoUser: true
        };

        // Store authentication data
        localStorage.setItem('authToken', mockToken);
        localStorage.setItem('authUser', JSON.stringify(demoUser));
        
        setToken(mockToken);
        setUser(demoUser);
        setIsAuthenticated(true);
        setIsDemoUser(true);
        
        return { success: true };
      }

      // Check if Firebase auth is available
      if (!auth) {
        return { success: false, error: 'Firebase authentication not available. Please check your configuration.' };
      }

      // Real user authentication with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();
      
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        isDemoUser: false
      };

      setToken(idToken);
      setUser(userData);
      setIsAuthenticated(true);
      setIsDemoUser(false);
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Check if Firebase auth is available
    if (!auth) {
      return { success: false, error: 'Firebase authentication not available. Please check your configuration.' };
    }

    try {
      // Real user signup with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();
      
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        isDemoUser: false
      };

      setToken(idToken);
      setUser(userData);
      setIsAuthenticated(true);
      setIsDemoUser(false);
      
      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // If this is a demo user, just clear localStorage
      if (isDemoUser) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      } else {
        // Check if Firebase auth is available
        if (auth) {
          // Real user logout with Firebase
          await signOut(auth);
        } else {
          // Just clear local storage if Firebase is not available
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }

    // Clear state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsDemoUser(true); // Default back to demo mode
    
    // Redirect to login page
    window.location.href = '/login';
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    token,
    login,
    logout,
    signup,
    isDemoUser, // Expose the demo user status
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}