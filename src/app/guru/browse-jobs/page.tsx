"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { api } from "@/lib/api";
import { Category, Paginated, Requirement } from "@/lib/types";
import { money, date } from "@/lib/format";

const PAGE_SIZE = 10;

function BrowseJobsContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Paginated<Requirement> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Category[]>("/categories")
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [category]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (category) params.set("category", category);
      const res = await api.get<Paginated<Requirement>>(`/requirements/open?${params.toString()}`);
      setJobs(res);
    } catch {
      setJobs(null);
    } finally {
      setLoading(false);
    }
  }, [category, page]);

  useEffect(() => {
    load();
  }, [load]);

  const items = jobs?.items ?? [];
  const total = jobs?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">Find work</div>
        <h1>Browse jobs</h1>
        <p>Job posts matching your categories and skills. Submitting a proposal uses one connect.</p>
      </div>

      <div
        className="flex-between"
        style={{ marginBottom: 16, background: "var(--color-primary-light)", padding: "12px 16px", borderRadius: "var(--radius-md)" }}
      >
        <span style={{ color: "var(--color-primary-dark)", fontWeight: 600, fontSize: 14 }}>Proposals &amp; Connects remaining: 8</span>
        <a href="#" style={{ fontSize: 13, fontWeight: 600 }}>
          Buy more connects →
        </a>
      </div>

      <div className="grid grid-sidebar">
        <div className="stack">
          {loading ? (
            <div className="card">
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </div>
                Loading jobs…
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </div>
                No open jobs match this filter right now.
              </div>
            </div>
          ) : (
            items.map((job) => (
              <div className="card" key={job.id}>
                <div className="guru-card" style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div className="flex-between">
                      <Link href={`/guru/jobs/${job.id}`} style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>
                        {job.title}
                      </Link>
                      <strong>{money(job.budgetAmount)}</strong>
                    </div>
                    <p className="faint" style={{ margin: "4px 0 8px" }}>
                      {job.budgetType === "FIXED_MILESTONES" ? "Milestones" : "Fixed price"} · Posted {date(job.createdAt)}
                      {typeof job.proposalCount === "number" ? ` · ${job.proposalCount} proposals` : ""}
                    </p>
                    <span className="tag">{job.categoryName}</span>
                    <p style={{ margin: "10px 0 0", fontSize: 13 }}>{job.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="pagination">
            <span className="faint">
              {total === 0 ? "Showing 0 jobs" : `Showing ${rangeStart}–${rangeEnd} of ${total} jobs`}
            </span>
            <div className="pages">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ‹
              </button>
              {total > 0 &&
                Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={p === page ? "active" : undefined} onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
              <button disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                ›
              </button>
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <h3>Filters</h3>
            <div className="field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Budget</label>
              <select>
                <option>Any budget</option>
                <option>Under $500</option>
                <option>$500 – $1,500</option>
                <option>$1,500 – $5,000</option>
                <option>$5,000+</option>
              </select>
            </div>
            <div className="field">
              <label>Duration</label>
              <select>
                <option>Any duration</option>
                <option>Less than 1 week</option>
                <option>1–4 weeks</option>
                <option>1–3 months</option>
                <option>3+ months</option>
              </select>
            </div>
            <div className="field">
              <label>Posted date</label>
              <select>
                <option>Anytime</option>
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <div className="field">
              <label>Payment method</label>
              <div className="flex-gap" style={{ flexWrap: "wrap" }}>
                <label className="badge badge-info" style={{ cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked style={{ marginRight: 6 }} />
                  Milestones
                </label>
                <label className="badge badge-neutral" style={{ cursor: "pointer" }}>
                  <input type="checkbox" style={{ marginRight: 6 }} />
                  Full pay after training
                </label>
              </div>
            </div>
            <button className="btn btn-secondary btn-block" onClick={() => setCategory("")}>
              Reset filters
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function GuruBrowseJobsPage() {
  return (
    <DashboardShell role="GURU">
      <BrowseJobsContent />
    </DashboardShell>
  );
}
