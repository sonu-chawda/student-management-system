import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TOKEN_KEY } from "./api";

const AuthContext = createContext(null);

// A JWT is "header.payload.signature"; the payload is base64url-encoded JSON.
function decodeToken(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function isValid(token) {
  if (!token) return false;
  const payload = decodeToken(token);
  return Boolean(payload && payload.exp && payload.exp * 1000 > Date.now());
}

export function AuthProvider({ children }) {
  // The token now survives a page refresh (stored in localStorage)
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    return isValid(stored) ? stored : "";
  });

  const login = useCallback((receivedToken) => {
    localStorage.setItem(TOKEN_KEY, receivedToken);
    setToken(receivedToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
  }, []);

  const user = useMemo(() => {
    const payload = token ? decodeToken(token) : null;
    return payload ? { username: payload.sub, role: payload.role } : null;
  }, [token]);

  // Log out automatically when the token expires
  useEffect(() => {
    if (!token) return undefined;
    const payload = decodeToken(token);
    const msLeft = payload ? payload.exp * 1000 - Date.now() : 0;
    const id = setTimeout(logout, Math.min(Math.max(msLeft, 0), 2 ** 31 - 1));
    return () => clearTimeout(id);
  }, [token, logout]);

  // api.js fires this event when the server answers 401
  useEffect(() => {
    window.addEventListener("auth:unauthorized", logout);
    return () => window.removeEventListener("auth:unauthorized", logout);
  }, [logout]);

  const value = useMemo(
    () => ({ token, user, isAdmin: user?.role === "ADMIN", login, logout }),
    [token, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
