import { createContext, useContext } from 'react';

// interface of contract for data AuthContext should contain
export interface AuthContextState {
  /** The logged-in user's email, or null if not authenticated. */
  user: string | null;
  /** Whether the user is authenticated (has a valid access token). */
  isAuthenticated: boolean;
  /** Whether the initial session restore (refresh token check) is still in progress. */
  isLoading: boolean;
  /** Logs in with email/password. Throws on failure. */
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  /** Registers a new account. Throws on failure. */
  register: (email: string, password: string) => Promise<void>;
  /** Logs out and clears all tokens. */
  logout: () => void;
}

// Create a context api to access this AuthContext data across component without prop drilling
export const AuthContext = createContext<AuthContextState>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

// Export useAuth which wrap the useContext call to access AuthContext
export function useAuth() {
  return useContext(AuthContext);
}
