"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function RegisterStudentPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agree) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ role: "STUDENT", fullName, email, password, country, city });
      router.push("/student/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      headline="Learn from real experts, on your terms."
      copy="Post what you want to learn once, and get matched with verified gurus who fit your budget, timeline and skill level."
    >
      <h2>Create your student account</h2>
      <p className="faint" style={{ marginBottom: 24 }}>
        Free to join — start posting requirements right away.
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
          <label>Full name</label>
          <input
            type="text"
            placeholder="e.g. Riya Sharma"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="hint">Must be unique — we&apos;ll send a verification link to this address.</div>
        </div>

        <div className="grid grid-2">
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="hint" style={{ marginTop: -10, marginBottom: 8 }}>
          At least 8 characters, with one number and one uppercase letter.
        </div>

        <div className="grid grid-2">
          <div className="field">
            <label>Country</label>
            <select required value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">Select country</option>
              <option>United States</option>
              <option>United Kingdom</option>
              <option>India</option>
              <option>Canada</option>
              <option>Australia</option>
              <option>Singapore</option>
              <option>United Arab Emirates</option>
            </select>
          </div>
          <div className="field">
            <label>Location / City</label>
            <input
              type="text"
              placeholder="e.g. Bengaluru"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Preferred language</label>
          <select>
            <option>English</option>
            <option>Hindi</option>
            <option>Spanish</option>
            <option>French</option>
            <option>Mandarin</option>
            <option>Arabic</option>
          </select>
        </div>

        <div className="field">
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 400 }}>
            <input
              type="checkbox"
              required
              style={{ width: "auto", marginTop: 3 }}
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </span>
          </label>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="faint" style={{ marginTop: 20, textAlign: "center" }}>
        Already have an account? <Link href="/auth/login">Log in</Link>
      </p>
    </AuthShell>
  );
}
