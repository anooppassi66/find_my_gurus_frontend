"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/guru/browse-jobs", label: "Find Work" },
  { href: "/gurus", label: "Find a Guru" },
  { href: "#", label: "How it Works" },
  { href: "#", label: "Pricing" },
];

export function dashboardHref(role?: string) {
  return role === "GURU" ? "/guru/dashboard" : "/student/dashboard";
}

export function PublicNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <Link href="/" style={{ textDecoration: "none" }}>
          <div className="brand">
            <img src="/assets/logo.png" alt="Find My Gurus" className="brand-mark" />
          </div>
        </Link>
        <div className="nav-links">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={n.href !== "#" && pathname.startsWith(n.href) ? "active" : undefined}
            >
              {n.label}
            </Link>
          ))}
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <Link href={dashboardHref(user.role)} className="btn btn-secondary btn-sm">
                Dashboard
              </Link>
              <button className="btn btn-primary btn-sm" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-secondary btn-sm">
                Log in
              </Link>
              <Link href="/auth/role-select" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export function MegaFooter({ style }: { style?: React.CSSProperties }) {
  return (
    <footer className="mega-footer" style={style}>
      <div className="container">
        <div className="mega-footer-grid">
          <div>
            <h4>For Students</h4>
            <Link href="/student/post-requirement">Post a requirement</Link>
            <Link href="/gurus">Find a guru</Link>
            <a href="#">How it works</a>
          </div>
          <div>
            <h4>For Gurus</h4>
            <Link href="/auth/register/guru">Become a guru</Link>
            <Link href="/guru/browse-jobs">Find work</Link>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="#">By Skills</a>
            <a href="#">Trending Skills</a>
            <a href="#">By Location</a>
            <a href="#">Trending Courses</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#">FAQ</a>
            <a href="#">Contact</a>
            <a href="#">Blog</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
          <div>
            <h4>Account</h4>
            <Link href="/auth/login">Log in</Link>
            <Link href="/auth/role-select">Sign up</Link>
          </div>
        </div>
        <div className="mega-footer-bottom">
          <span>&copy; 2026 Find My Gurus. All rights reserved.</span>
          <span>Made for learning, from real experts.</span>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({
  children,
  footerStyle,
}: {
  children: ReactNode;
  footerStyle?: React.CSSProperties;
}) {
  return (
    <>
      <PublicNav />
      {children}
      <MegaFooter style={footerStyle} />
    </>
  );
}
