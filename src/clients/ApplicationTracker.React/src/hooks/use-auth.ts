import {createContext, useContext} from 'react';

export interface AuthContextState {
  /** The logged-in user's email, or null if not authenticated. */
  user: string | null;
  /** Whether the user is authenticated (has a valid access token). */
  isAuthenticated: boolean;
  /** Whether the initial session restore (refresh token check) is still in progress. */
  isLoading: boolean;
  /** Whether the app is running in demo mode (no real account required). */
  isDemoMode: boolean;
  /** Logs in with email/password. Throws on failure. */
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  /** Registers a new account. Throws on failure. */
  register: (email: string, password: string) => Promise<void>;
  /** Logs out and clears all tokens. */
  logout: () => void;
  /** Enters demo mode with pre-seeded sample data. */
  enterDemoMode: () => void;
  /** Exits demo mode and clears all demo data from sessionStorage. */
  exitDemoMode: () => void;
}

export const AuthContext = createContext<AuthContextState>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isDemoMode: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  enterDemoMode: () => {},
  exitDemoMode: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
