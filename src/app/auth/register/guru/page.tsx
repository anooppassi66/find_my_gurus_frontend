"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function RegisterGuruPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api
      .get<Category[]>("/categories")
      .then((all) => setCategories(all.filter((c) => c.parentId === null)))
      .catch(() => setCategories([]));
  }, []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("");
  const [headline, setHeadline] = useState("");
  const [category, setCategory] = useState("");
  const [skills, setSkills] = useState<string[]>(["React Native", "JavaScript", "Redux", "Firebase"]);
  const [skillInput, setSkillInput] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addSkill(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const v = skillInput.trim();
      if (v && !skills.includes(v)) setSkills([...skills, v]);
      setSkillInput("");
    }
  }

  function removeSkill(s: string) {
    setSkills(skills.filter((x) => x !== s));
  }

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
      await register({ role: "GURU", fullName, email, password, country, city });
      try {
        await api.put("/gurus/me", {
          headline,
          skills,
          ...(category ? { categoryId: Number(category) } : {}),
        });
      } catch {
        // profile details are best-effort here; registration already succeeded
      }
      router.push("/guru/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      headline="Turn your expertise into income."
      copy="Set your rate, list your skills, and get discovered by students actively looking for someone exactly like you."
    >
      <h2>Create your guru account</h2>
      <p className="faint" style={{ marginBottom: 24 }}>
        Free to join — start bidding on jobs once your profile is set up.
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
            placeholder="e.g. Aisha Khan"
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
              placeholder="e.g. Pune"
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

        <hr className="divider" />

        <div className="field">
          <label>Headline / title</label>
          <input
            type="text"
            placeholder="e.g. React Native mentor, 6 yrs"
            required
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Primary category</label>
          <select required value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Subcategories / skills</label>
          <div>
            {skills.map((s) => (
              <span key={s} className="tag">
                {s} <span style={{ cursor: "pointer" }} onClick={() => removeSkill(s)}>&times;</span>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a skill and press enter"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={addSkill}
          />
          <div className="hint">Drives which job posts you get notified about.</div>
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
