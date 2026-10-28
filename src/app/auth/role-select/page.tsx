"use client";

import Link from "next/link";
import AuthShell from "@/components/AuthShell";

export default function RoleSelectPage() {
  return (
    <AuthShell
      headline="One platform, two ways to grow."
      copy="Whether you're chasing a new skill or ready to teach what you know, Find My Gurus matches you with the right people in minutes."
    >
      <h2>Join as a Student or a Guru</h2>
      <p className="faint" style={{ marginBottom: 24 }}>
        Pick the option that fits you best — you can always add the other role later from your profile.
      </p>

      <div className="stack">
        <Link href="/auth/register/student" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="role-card">
            <div className="icon">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <h3 style={{ marginBottom: 2 }}>I&apos;m a Student</h3>
              <p className="faint" style={{ margin: 0 }}>
                I want to learn — post a requirement and get matched with gurus.
              </p>
            </div>
          </div>
        </Link>
        <Link href="/auth/register/guru" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="role-card">
            <div className="icon">
              <i className="fa-solid fa-chalkboard-user"></i>
            </div>
            <div>
              <h3 style={{ marginBottom: 2 }}>I&apos;m a Guru</h3>
              <p className="faint" style={{ margin: 0 }}>
                I want to teach &amp; earn — bid on jobs and build a client base.
              </p>
            </div>
          </div>
        </Link>
      </div>

      <p className="faint" style={{ marginTop: 24, textAlign: "center" }}>
        Already have an account? <Link href="/auth/login">Log in</Link>
      </p>
    </AuthShell>
  );
}
