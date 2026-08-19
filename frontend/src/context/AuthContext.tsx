import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface AuthUser {
  fullName: string;
  email: string;
  mobile?: string;
  organization?: string;
  role: string;
}

interface StoredAccount extends AuthUser {
  password: string;
}

interface SignupInput {
  fullName: string;
  email: string;
  mobile?: string;
  organization?: string;
  role: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (input: SignupInput) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const ACCOUNTS_KEY = "pni_accounts";
const SESSION_KEY = "pni_session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // ignore corrupt session
    }
    setLoading(false);
  }, []);

  const login: AuthContextValue["login"] = async (email, password) => {
    const accounts = getAccounts();
    const match = accounts.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
    );
    if (!match) {
      return { ok: false, error: "Invalid email or password." };
    }
    const { password: _pw, ...publicUser } = match;
    setUser(publicUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
    return { ok: true };
  };

  const signup: AuthContextValue["signup"] = async (input) => {
    const accounts = getAccounts();
    const exists = accounts.some((a) => a.email.toLowerCase() === input.email.trim().toLowerCase());
    if (exists) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const newAccount: StoredAccount = {
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      mobile: input.mobile?.trim() || undefined,
      organization: input.organization?.trim() || undefined,
      role: input.role,
      password: input.password,
    };
    saveAccounts([...accounts, newAccount]);
    const { password: _pw, ...publicUser } = newAccount;
    setUser(publicUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
