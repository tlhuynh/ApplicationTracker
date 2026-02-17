import {useEffect, useRef, useState} from 'react';
import {AuthContext} from '@/hooks/use-auth';
import {login as apiLogin, register as apiRegister, logout as apiLogout} from '@/api/auth';
import {setAccessToken, refreshToken} from '@/api/client';

const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Decodes the payload of a JWT to extract claims.
 *
 * JWTs have three base64url-encoded parts separated by dots: header.payload.signature.
 * We only need the payload (index 1). base64url differs from standard base64 in two chars
 * (- instead of +, _ instead of /), so we swap them back before decoding with atob().
 */
function decodeJwtPayload(token: string): Record<string, string> {
  const payload = token.split('.')[1];
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

/**
 * Extracts the user's email from a JWT access token.
 *
 * The backend uses JwtRegisteredClaimNames.Email, which produces
 * the standard "email" claim in the JWT payload.
 */
function extractEmail(token: string): string | null {
  const claims = decodeJwtPayload(token);
  return claims['email'] ?? null;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({children}: AuthProviderProps) {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // NOTES: userRef here so that when ref changes, it doesn't trigger re-render. This will not be displayed anyway
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // NOTES: since it is a useCallback, this will be memoizes/caches so it doesn't get recreated on every render
  /**
   * Ref-based schedule function — avoids the "accessed before declared" error
   * that occurs when a useCallback references itself recursively.
   * The ref always points to the latest version of the function.
   */
  const scheduleRefreshRef = useRef<(expiresAt: string, currentRefreshToken: string) => void>(
    () => {
    });

  useEffect(() => {
    scheduleRefreshRef.current = (expiresAt: string, currentRefreshToken: string) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      const expiresMs = new Date(expiresAt).getTime();
      const nowMs = Date.now();
      const delay = Math.max((expiresMs - nowMs) * 0.8, 10_000);

      refreshTimerRef.current = setTimeout(() => {
        refreshToken(currentRefreshToken)
          .then((response) => {
            const newAccessToken = response.accessToken ?? '';
            const newRefreshToken = response.refreshToken ?? '';

            setAccessToken(newAccessToken);
            setUser(extractEmail(newAccessToken));
            localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

            if (response.expiresAt) {
              scheduleRefreshRef.current(response.expiresAt, newRefreshToken);
            }
          })
          .catch(() => {
            setAccessToken(null);
            setUser(null);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
          });
      }, delay);
    };
  }, []);

  /**
   * On mount: attempt to restore the session from a stored refresh token.
   *
   * If the user previously logged in and still has a valid refresh token in localStorage,
   * we exchange it for a new access token — so the user doesn't have to log in again
   * after a page refresh. If it fails (expired/revoked), we silently stay logged out.
   */
  useEffect(() => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!storedRefreshToken) {
      // NOTES: React compiler doesn't like calling setState synchronously in an effect.
      // Wrap in Promise.resolve to avoid synchronous setState in effect body
      Promise.resolve().then(() => setIsLoading(false));
      return;
    }

    refreshToken(storedRefreshToken)
      .then((response) => {
        const newAccessToken = response.accessToken ?? '';
        const newRefreshToken = response.refreshToken ?? '';

        setAccessToken(newAccessToken);
        setUser(extractEmail(newAccessToken));
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

        if (response.expiresAt) {
          scheduleRefreshRef.current(response.expiresAt, newRefreshToken);
        }
      })
      .catch(() => {
        // Stored refresh token is invalid — clean up
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []); // no dependency on scheduleRefresh needed — refs are stable

  // Clean up refresh timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    const response = await apiLogin({email, password, rememberMe});
    const accessToken = response.accessToken ?? '';
    const newRefreshToken = response.refreshToken ?? '';

    setAccessToken(accessToken);
    setUser(extractEmail(accessToken));

    if (newRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

      if (response.expiresAt) {
        scheduleRefreshRef.current(response.expiresAt, newRefreshToken);
      }
    }
  };

  const handleRegister = async (email: string, password: string) => {
    await apiRegister({email, password});
    // Don't auto-login — let the user log in explicitly after registration
  };

  const handleLogout = () => {
    const storedToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedToken) {
      apiLogout(storedToken).catch(() => {});
    }

    setAccessToken(null);
    setUser(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
