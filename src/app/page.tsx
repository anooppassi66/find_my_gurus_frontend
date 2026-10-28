"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PublicLayout from "@/components/PublicLayout";
import { api } from "@/lib/api";
import { stars } from "@/lib/format";
import { Category, GuruSummary } from "@/lib/types";
import { initials } from "@/components/DashboardShell";

const CATEGORY_ICONS: Record<string, string> = {
  "Web Development": "fa-laptop-code",
  "Graphic Design": "fa-palette",
  "Data Science": "fa-chart-column",
  "Spoken Languages": "fa-comments",
  "Music Production": "fa-music",
  "Business Coaching": "fa-chart-line",
};

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [guruCounts, setGuruCounts] = useState<Record<number, number>>({});
  const [gurus, setGurus] = useState<GuruSummary[] | null>(null);

  useEffect(() => {
    const order = Object.keys(CATEGORY_ICONS);
    const rank = (name: string) => (order.includes(name) ? order.indexOf(name) : order.length);
    api
      .get<Category[]>("/categories")
      .then((list) => {
        const top = list
          .filter((c) => !c.parentId)
          .sort((a, b) => rank(a.name) - rank(b.name))
          .slice(0, 6);
        setCategories(top);
        top.forEach((c) =>
          api
            .get<{ total: number }>(`/gurus?category=${c.id}&pageSize=1`)
            .then((res) => setGuruCounts((prev) => ({ ...prev, [c.id]: res.total })))
            .catch(() => {})
        );
      })
      .catch(() => setCategories([]));
    api
      .get<{ items: GuruSummary[] }>("/gurus?pageSize=3")
      .then((res) => setGurus(res.items))
      .catch(() => setGurus([]));
  }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/gurus?q=${encodeURIComponent(q)}`);
  }

  return (
    <PublicLayout>
      <style>{`
        .step-card { text-align: center; padding: 24px 18px; }
        .step-card .num {
          width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary);
          display: flex; align-items: center; justify-content: center; font-weight: 800; margin: 0 auto 14px;
        }
        .cat-pill {
          display: flex; align-items: center; gap: 10px; padding: 14px 16px;
          border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface);
        }
        .cat-pill:hover { border-color: var(--color-primary); }
        .cat-pill .icon {
          width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--color-secondary-light); color: var(--color-secondary);
          display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
        }
        .trust-row { display: flex; gap: 32px; flex-wrap: wrap; justify-content: center; margin-top: 28px; }
        .trust-row div { text-align: center; }
        .trust-row .num { font-size: 24px; font-weight: 800; color: #fff; }
        .trust-row .label { font-size: 12px; color: rgba(255,255,255,0.7); }
      `}</style>

      <div className="hero-public">
        <div className="container" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 38, maxWidth: 680, margin: "0 auto 14px" }}>
            Find the right guru. Learn what actually matters.
          </h1>
          <p style={{ maxWidth: 560, margin: "0 auto 28px", fontSize: 16 }}>
            Post what you want to learn, get matched with vetted experts, and pay safely through milestone-protected
            contracts.
          </p>
          <form className="search-bar" style={{ margin: "0 auto" }} onSubmit={onSearch}>
            <input
              type="text"
              placeholder="What do you want to learn? e.g. 'React Native'"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Search gurus
            </button>
          </form>
          <div className="trust-row">
            <div>
              <div className="num">12,400+</div>
              <div className="label">Gurus on the platform</div>
            </div>
            <div>
              <div className="num">38,900+</div>
              <div className="label">Contracts completed</div>
            </div>
            <div>
              <div className="num">4.8/5</div>
              <div className="label">Average guru rating</div>
            </div>
            <div>
              <div className="num">190+</div>
              <div className="label">Skill categories</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <div className="section-head">
            <div
              className="eyebrow"
              style={{
                color: "var(--color-primary)",
                textTransform: "uppercase",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".08em",
                marginBottom: 8,
              }}
            >
              Popular categories
            </div>
            <h2>Explore by skill</h2>
            <p>Browse gurus and jobs across our most active categories.</p>
          </div>
          <div className="grid grid-3">
            {categories === null ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </div>
              </div>
            ) : categories.length === 0 ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-shapes"></i>
                </div>
                No categories yet.
              </div>
            ) : (
              categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/gurus?category=${c.id}`}
                  className="cat-pill"
                  style={{ textDecoration: "none" }}
                >
                  <div className="icon">
                    <i className={`fa-solid ${CATEGORY_ICONS[c.name] || "fa-shapes"}`}></i>
                  </div>
                  <div>
                    <strong style={{ color: "var(--color-text)" }}>{c.name}</strong>
                    <div className="faint">
                      {(guruCounts[c.id] ?? 0).toLocaleString("en-US")}{" "}
                      {guruCounts[c.id] === 1 ? "guru" : "gurus"}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div style={{ textAlign: "center", marginTop: 22 }}>
            <Link href="/gurus" style={{ fontWeight: 700, fontSize: 14 }}>
              Browse all categories →
            </Link>
          </div>
        </div>
      </div>

      <div className="section" style={{ background: "var(--color-surface-alt)" }}>
        <div className="container">
          <div className="section-head">
            <div
              className="eyebrow"
              style={{
                color: "var(--color-primary)",
                textTransform: "uppercase",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".08em",
                marginBottom: 8,
              }}
            >
              How it works
            </div>
            <h2>From post to paid, in five steps</h2>
          </div>
          <div className="grid grid-3">
            <div className="card step-card">
              <div className="num">1</div>
              <h3>Post a requirement</h3>
              <p className="faint">Tell us what you want to learn — category, budget, and timeline.</p>
            </div>
            <div className="card step-card">
              <div className="num">2</div>
              <h3>Get matched</h3>
              <p className="faint">We notify gurus in that category and suggest top-rated profiles.</p>
            </div>
            <div className="card step-card">
              <div className="num">3</div>
              <h3>Chat &amp; agree milestones</h3>
              <p className="faint">Discuss in encoded in-app chat, then set milestones together.</p>
            </div>
            <div className="card step-card">
              <div className="num">4</div>
              <h3>Learn &amp; track progress</h3>
              <p className="faint">Video calls, file sharing, and milestone approvals keep things on track.</p>
            </div>
            <div className="card step-card">
              <div className="num">5</div>
              <h3>Pay safely</h3>
              <p className="faint">Funds release per milestone — refunded automatically if a contract fails.</p>
            </div>
            <div className="card step-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <a href="#" className="btn btn-primary" style={{ margin: "0 auto" }}>
                See the full flow →
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <div className="section-head">
            <div
              className="eyebrow"
              style={{
                color: "var(--color-primary)",
                textTransform: "uppercase",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".08em",
                marginBottom: 8,
              }}
            >
              Featured gurus
            </div>
            <h2>Learn from top-rated experts</h2>
          </div>
          <div className="grid grid-3">
            {gurus === null ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </div>
              </div>
            ) : gurus.length === 0 ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-user-graduate"></i>
                </div>
                No gurus yet.
              </div>
            ) : (
              gurus.map((g) => (
                <div
                  key={g.userId}
                  className="guru-card"
                  style={{ flexDirection: "column", textAlign: "center", alignItems: "center" }}
                >
                  <div className="guru-photo" style={{ width: 64, height: 64, fontSize: 18 }}>
                    {initials(g.fullName)}
                  </div>
                  <strong>{g.fullName}</strong>
                  <div className="stars">
                    {stars(g.ratingAvg).map((c, i) => (
                      <i key={i} className={`${c} fa-star`}></i>
                    ))}{" "}
                    <span className="faint">
                      {g.ratingAvg ?? "—"} ({g.ratingCount})
                    </span>
                  </div>
                  <p className="faint" style={{ margin: "6px 0 10px" }}>
                    {g.headline || g.categoryName || ""}
                  </p>
                  <Link href={`/gurus/${g.userId}`} className="btn btn-secondary btn-sm">
                    View profile
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div
        className="section"
        style={{ background: "linear-gradient(135deg, var(--color-secondary-darker), var(--color-secondary))", color: "#fff" }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ color: "#fff" }}>Have a skill worth teaching?</h2>
          <p style={{ color: "rgba(255,255,255,.78)", maxWidth: 520, margin: "0 auto 20px" }}>
            Set your own rate, get matched to students by category, and get paid safely through milestone-protected
            contracts.
          </p>
          <Link href="/auth/register/guru" className="btn btn-primary">
            Become a guru →
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
