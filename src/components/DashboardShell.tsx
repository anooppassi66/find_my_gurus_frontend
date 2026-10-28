"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { Role, useAuth } from "@/lib/auth";

type Item = { href: string; icon: string; label: string; match?: (p: string) => boolean };
type Group = { label: string; items: Item[] };

const exact = (href: string) => (p: string) => p === href;
const prefix = (href: string) => (p: string) => p === href || p.startsWith(href + "/");

// Mirrors the static prototype's student/guru top menus. Items without a
// Next.js route yet (invoices, grievance, reviews, notifications, profile)
// point at "#" so the menu stays identical to the prototype.
const STUDENT: Group[] = [
  { label: "Overview", items: [{ href: "/student/dashboard", icon: "fa-gauge", label: "Dashboard" }] },
  {
    label: "Jobs",
    items: [
      { href: "/student/post-requirement", icon: "fa-file-circle-plus", label: "Post Requirement" },
      { href: "/student/requirements", icon: "fa-list-check", label: "My Requirements", match: prefix("/student/requirements") },
      { href: "/gurus", icon: "fa-magnifying-glass", label: "Suggested Gurus", match: prefix("/gurus") },
    ],
  },
  {
    label: "Contracts",
    items: [
      { href: "/contracts", icon: "fa-file-signature", label: "Contracts", match: exact("/contracts") },
      { href: "/contracts", icon: "fa-flag-checkered", label: "Milestones", match: (p) => p.startsWith("/contracts/") },
    ],
  },
  { label: "Messages", items: [{ href: "/messages", icon: "fa-comments", label: "Messages", match: prefix("/messages") }] },
  {
    label: "Payments",
    items: [
      { href: "/wallet", icon: "fa-wallet", label: "Wallet" },
      { href: "#", icon: "fa-file-invoice-dollar", label: "Invoices" },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "#", icon: "fa-scale-balanced", label: "Grievance" },
      { href: "#", icon: "fa-star", label: "Reviews" },
      { href: "#", icon: "fa-bell", label: "Notifications" },
    ],
  },
  { label: "Account", items: [{ href: "#", icon: "fa-user-gear", label: "Profile & Settings" }] },
];

const GURU: Group[] = [
  { label: "Overview", items: [{ href: "/guru/dashboard", icon: "fa-gauge", label: "Dashboard" }] },
  {
    label: "Work",
    items: [
      { href: "/guru/browse-jobs", icon: "fa-magnifying-glass", label: "Browse Jobs", match: (p) => p === "/guru/browse-jobs" || p.startsWith("/guru/jobs/") },
      { href: "/guru/proposals", icon: "fa-paper-plane", label: "My Proposals" },
      { href: "/contracts", icon: "fa-briefcase", label: "My Jobs", match: exact("/contracts") },
    ],
  },
  {
    label: "Contracts",
    items: [{ href: "/contracts", icon: "fa-flag-checkered", label: "Milestones", match: (p) => p.startsWith("/contracts/") }],
  },
  { label: "Messages", items: [{ href: "/messages", icon: "fa-comments", label: "Messages", match: prefix("/messages") }] },
  {
    label: "Earnings",
    items: [
      { href: "/commission-calculator", icon: "fa-calculator", label: "Commission Calculator" },
      { href: "/wallet", icon: "fa-wallet", label: "Wallet" },
      { href: "#", icon: "fa-file-invoice-dollar", label: "Invoices" },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "#", icon: "fa-scale-balanced", label: "Grievance" },
      { href: "#", icon: "fa-star", label: "Reviews" },
      { href: "#", icon: "fa-bell", label: "Notifications" },
    ],
  },
  { label: "Account", items: [{ href: "#", icon: "fa-user-gear", label: "Profile & Settings" }] },
];

function isActive(item: Item, pathname: string) {
  if (item.href === "#") return false;
  return item.match ? item.match(pathname) : pathname === item.href;
}

export function initials(name?: string) {
  if (!name) return "";
  const parts = name.replace(/\./g, " ").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export default function DashboardShell({
  children,
  role,
}: {
  children: ReactNode;
  role?: Role;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/auth/login");
    else if (role && user.role !== role) router.replace(user.role === "GURU" ? "/guru/dashboard" : "/student/dashboard");
  }, [loading, user, role, router]);

  const groups = user?.role === "GURU" ? GURU : STUDENT;
  const activeGroup = groups.find((g) => g.items.some((i) => isActive(i, pathname)));

  return (
    <>
      <nav className="topnav">
        <div className="topnav-inner">
          <Link href="/" style={{ textDecoration: "none" }}>
            <div className="brand">
              <img src="/assets/logo.png" alt="Find My Gurus" className="brand-mark" />
            </div>
          </Link>
          <div className="nav-right">
            <a href="#" className="icon-btn" title="Notifications">
              <i className="fa-solid fa-bell"></i>
            </a>
            <button className="btn btn-secondary btn-sm">Help</button>
            <div
              className="avatar"
              title="Log out"
              style={{ cursor: "pointer" }}
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              {initials(user?.fullName)}
            </div>
          </div>
        </div>
      </nav>

      <div className="app-shell">
        <div className="app-subheader">
          <nav className="topmenu">
            {groups.map((g) => (
              <Link key={g.label} href={g.items[0].href} className={g === activeGroup ? "active" : undefined}>
                <i className={`fa-solid ${g.items[0].icon}`}></i>
                {g.label}
              </Link>
            ))}
          </nav>
          <nav className="subtopmenu">
            {(activeGroup ?? groups[0]).items.map((i) => (
              <Link key={i.label} href={i.href} className={isActive(i, pathname) ? "active" : undefined}>
                <i className={`fa-solid ${i.icon}`}></i>
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
        <main className="app-main">
          <div className="container" style={{ maxWidth: "100%", padding: 0 }}>
            {loading || !user || (role && user.role !== role) ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </div>
                Loading…
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </>
  );
}
