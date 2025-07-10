// Auth utility functions and types
import type { User, LoginData, InsertUser } from "@shared/schema";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  login: (data: LoginData) => Promise<void>;
  register: (data: InsertUser) => Promise<void>;
  logout: () => Promise<void>;
}

// Auth utility functions
export const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem('matchbox_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const storeUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem('matchbox_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('matchbox_user');
  }
};

export const clearAuthStorage = (): void => {
  localStorage.removeItem('matchbox_user');
  localStorage.removeItem('matchbox_token');
};

// Validation helpers
export const validateNickname = (nickname: string): string | null => {
  if (!nickname) return "Nickname è richiesto";
  if (nickname.length < 3) return "Nickname deve essere almeno 3 caratteri";
  if (nickname.length > 20) return "Nickname non può superare 20 caratteri";
  if (!/^[a-zA-Z0-9_]+$/.test(nickname)) return "Nickname può contenere solo lettere, numeri e underscore";
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password è richiesta";
  if (password.length < 6) return "Password deve essere almeno 6 caratteri";
  if (password.length > 50) return "Password non può superare 50 caratteri";
  return null;
};

export const validateLocation = (location: string): string | null => {
  if (location && location.length > 100) return "Posizione non può superare 100 caratteri";
  return null;
};

// Auth constants
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Credenziali non valide",
  NICKNAME_TAKEN: "Nickname già in uso",
  NETWORK_ERROR: "Errore di connessione",
  UNKNOWN_ERROR: "Errore sconosciuto",
} as const;

export const AUTH_SUCCESS = {
  LOGIN: "Login effettuato con successo",
  REGISTER: "Account creato con successo",
  LOGOUT: "Logout effettuato con successo",
} as const;

// Session management
export const isSessionValid = (): boolean => {
  // In a real app, you might check token expiration
  return !!getStoredUser();
};

export const refreshSession = async (): Promise<User | null> => {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      storeUser(data.user);
      return data.user;
    }
    
    clearAuthStorage();
    return null;
  } catch {
    clearAuthStorage();
    return null;
  }
};

// Privacy utilities
export const getAnonymizedUserData = (user: User) => {
  return {
    id: user.id,
    nickname: user.nickname,
    location: user.location,
    // Never expose sensitive data like passwords
  };
};

export const isPrivacyCompliant = (userData: any): boolean => {
  const allowedFields = ['nickname', 'location'];
  const providedFields = Object.keys(userData);
  
  // Check that no sensitive fields are being sent
  const hasPersonalData = providedFields.some(field => 
    !allowedFields.includes(field) && 
    !['id', 'createdAt'].includes(field)
  );
  
  return !hasPersonalData;
};
