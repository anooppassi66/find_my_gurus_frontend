import Link from "next/link";
import { ReactNode } from "react";

export default function AuthShell({
  headline,
  copy,
  sideExtra,
  children,
}: {
  headline: ReactNode;
  copy: ReactNode;
  sideExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <div className="auth-side">
        <Link href="/" style={{ textDecoration: "none" }}>
          <div className="brand" style={{ color: "#fff", marginBottom: 24 }}>
            <img src="/assets/logo.png" alt="Find My Gurus" className="brand-mark" />
          </div>
        </Link>
        <h1 style={{ color: "#fff" }}>{headline}</h1>
        <p>{copy}</p>
        {sideExtra}
      </div>
      <div className="auth-form-col">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
