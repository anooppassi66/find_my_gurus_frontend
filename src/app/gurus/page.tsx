"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicLayout from "@/components/PublicLayout";
import { api } from "@/lib/api";
import { stars } from "@/lib/format";
import { Category, GuruSummary, Paginated } from "@/lib/types";
import { initials } from "@/components/DashboardShell";

const PAGE_SIZE = 10;

function GurusResults() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const minRating = searchParams.get("minRating") || "";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [qInput, setQInput] = useState(q);
  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<Paginated<GuruSummary> | null>(null);

  useEffect(() => {
    setQInput(q);
  }, [q]);

  useEffect(() => {
    api
      .get<Category[]>("/categories")
      .then((list) => setCategories(list.filter((c) => !c.parentId)))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setResult(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (minRating) params.set("minRating", minRating);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    api
      .get<Paginated<GuruSummary>>(`/gurus?${params.toString()}`)
      .then(setResult)
      .catch(() => setResult({ items: [], total: 0, page, pageSize: PAGE_SIZE }));
  }, [q, category, minRating, page]);

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`/gurus?${params.toString()}`);
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    pushParams({ q: qInput, page: undefined });
  }

  function onApplyFilters() {
    pushParams({ page: undefined });
  }

  function onReset() {
    router.push("/gurus");
  }

  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);

  const pageNumbers: (number | "...")[] = [];
  for (let p = 1; p <= Math.min(3, totalPages); p++) pageNumbers.push(p);
  if (totalPages > 4) pageNumbers.push("...");
  if (totalPages > 3 && !pageNumbers.includes(totalPages)) pageNumbers.push(totalPages);

  const currentCategory = categories.find((c) => String(c.id) === category);

  return (
    <>
      <div className="hero-public" style={{ padding: "40px 0" }}>
        <div className="container">
          <h1 style={{ fontSize: 26 }}>Find your guru</h1>
          <form className="search-bar" onSubmit={onSearch}>
            <input
              type="text"
              placeholder="Try 'React Native', 'IELTS', 'Piano'..."
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 32 }}>
        <div className="container">
          <div className="grid grid-sidebar">
            <div className="stack" style={{ order: 2 }}>
              <div className="results-head">
                <span className="faint">
                  {total.toLocaleString()} gurus found
                  {q ? ` for “${q}”` : ""}
                  {currentCategory ? ` in “${currentCategory.name}”` : ""}
                </span>
                <select style={{ width: "auto", minWidth: 180 }}>
                  <option>Sort: Best match</option>
                  <option>Sort: Highest rated</option>
                  <option>Sort: Most reviews</option>
                  <option>Sort: Price low to high</option>
                </select>
              </div>

              {result === null ? (
                <div className="empty-state">
                  <div className="icon">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                  </div>
                </div>
              ) : result.items.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">
                    <i className="fa-solid fa-user-magnifying-glass"></i>
                  </div>
                  No gurus match your search yet.
                </div>
              ) : (
                result.items.map((g) => (
                  <div key={g.userId} className="guru-card" style={{ alignItems: "center" }}>
                    <div className="guru-photo" style={{ width: 64, height: 64, fontSize: 18 }}>
                      {initials(g.fullName)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex-between">
                        <div>
                          <strong style={{ fontSize: 16 }}>{g.fullName}</strong>
                        </div>
                        <div className="stars">
                          {stars(g.ratingAvg).map((c, i) => (
                            <i key={i} className={`${c} fa-star`}></i>
                          ))}{" "}
                          <span className="faint">
                            {g.ratingAvg ?? "—"} ({g.ratingCount} reviews)
                          </span>
                        </div>
                      </div>
                      <p className="faint" style={{ margin: "4px 0 8px" }}>
                        {[g.headline, g.categoryName, [g.city, g.country].filter(Boolean).join(", ")]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <div>
                        {g.skills.map((s) => (
                          <span key={s} className="tag">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="flex-between" style={{ marginTop: 10 }}>
                        <span className="faint">&nbsp;</span>
                        <Link href={`/gurus/${g.userId}`} className="btn btn-secondary btn-sm">
                          View profile
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {result && result.items.length > 0 && (
                <div className="pagination">
                  <span className="faint">
                    Showing {from}–{to} of {total.toLocaleString()} gurus
                  </span>
                  <div className="pages">
                    {pageNumbers.map((p, i) =>
                      p === "..." ? (
                        <button key={`ellipsis-${i}`} disabled>
                          &hellip;
                        </button>
                      ) : (
                        <button
                          key={p}
                          className={p === page ? "active" : undefined}
                          onClick={() => pushParams({ page: String(p) })}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="stack" style={{ order: 1 }}>
              <div className="card">
                <h3>Filters</h3>
                <div className="field">
                  <label>Category</label>
                  <select value={category} onChange={(e) => pushParams({ category: e.target.value, page: undefined })}>
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Skill</label>
                  <div className="autosuggest">
                    <input type="text" placeholder="e.g. React Native" />
                  </div>
                </div>
                <div className="field">
                  <label>Location</label>
                  <select>
                    <option>Anywhere</option>
                    <option>Remote only</option>
                    <option>United States</option>
                    <option>India</option>
                    <option>Europe</option>
                  </select>
                </div>
                <div className="field">
                  <label>Minimum rating</label>
                  <select value={minRating} onChange={(e) => pushParams({ minRating: e.target.value, page: undefined })}>
                    <option value="">Any rating</option>
                    <option value="4.5">4.5 &amp; up</option>
                    <option value="4.0">4.0 &amp; up</option>
                    <option value="3.5">3.5 &amp; up</option>
                  </select>
                </div>
                <div className="field">
                  <label>Price band</label>
                  <select>
                    <option>Any price</option>
                    <option>Under $25/hr</option>
                    <option>$25 – $50/hr</option>
                    <option>$50 – $100/hr</option>
                    <option>$100+/hr</option>
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Availability</label>
                  <select>
                    <option>Any</option>
                    <option>Available now</option>
                  </select>
                </div>
                <button className="btn btn-primary btn-block" style={{ marginTop: 6 }} onClick={onApplyFilters}>
                  Apply Filters
                </button>
                <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={onReset}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function GurusPage() {
  return (
    <PublicLayout>
      <style>{`
        .results-head { display:flex; align-items:center; justify-content:space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
      `}</style>
      <Suspense
        fallback={
          <div className="section" style={{ paddingTop: 32 }}>
            <div className="container">
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <GurusResults />
      </Suspense>
    </PublicLayout>
  );
}
