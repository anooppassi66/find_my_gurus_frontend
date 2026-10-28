"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

export type Role = "STUDENT" | "GURU" | "ADMIN";

export interface AuthUser {
  id: number;
  role: Role;
  fullName: string;
  email: string;
  country?: string | null;
  city?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: {
    role: Role;
    fullName: string;
    email: string;
    password: string;
    country?: string;
    city?: string;
  }) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fmg_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: AuthUser }>("/auth/me")
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem("fmg_token");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("fmg_token", res.token);
    setUser(res.user);
    return res.user;
  }

  async function register(input: {
    role: Role;
    fullName: string;
    email: string;
    password: string;
    country?: string;
    city?: string;
  }) {
    const res = await api.post<{ token: string; user: AuthUser }>("/auth/register", input);
    localStorage.setItem("fmg_token", res.token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    localStorage.removeItem("fmg_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
