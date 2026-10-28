"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      router.push(user.role === "GURU" ? "/guru/dashboard" : "/student/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      headline="Welcome back."
      copy="Pick up where you left off — check new proposals, messages, and milestone updates waiting for you."
    >
      <h2>Log in</h2>
      <p className="faint" style={{ marginBottom: 24 }}>
        One account, two roles — we&apos;ll route you to your Student or Guru dashboard automatically.
      </p>

      {error && (
        <div
          className="card"
          style={{
            background: "var(--color-danger-bg)",
            borderColor: "var(--color-danger-bg)",
            color: "var(--color-danger)",
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <form className="stack" onSubmit={onSubmit}>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex-between">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, marginBottom: 0 }}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Remember me</span>
          </label>
          <a href="#" style={{ fontSize: 13, fontWeight: 600 }}>
            Forgot password?
          </a>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="faint" style={{ marginTop: 20, textAlign: "center" }}>
        New to Find My Gurus? <Link href="/auth/role-select">Sign up</Link>
      </p>
    </AuthShell>
  );
}
