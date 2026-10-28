"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { api, ApiError } from "@/lib/api";
import { Category, GuruSummary, Requirement } from "@/lib/types";
import { stars } from "@/lib/format";

export default function PostRequirementPage() {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [subCategoryId, setSubCategoryId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetType, setBudgetType] = useState<"FIXED_MILESTONES" | "FIXED_FULL_PAY">("FIXED_MILESTONES");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gurus, setGurus] = useState<GuruSummary[] | null>(null);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  useEffect(() => {
    api
      .get<Category[]>("/categories")
      .then(setAllCategories)
      .catch(() => setAllCategories([]));
  }, []);

  const categories = allCategories.filter((c) => c.parentId === null);
  const subCategories = allCategories.filter((c) => c.parentId === categoryId);

  useEffect(() => {
    const effectiveCategory = subCategoryId || categoryId;
    const path = effectiveCategory
      ? `/gurus?category=${effectiveCategory}&pageSize=2`
      : `/gurus?pageSize=2`;
    api
      .get<{ items: GuruSummary[] }>(path)
      .then((res) => setGurus(res.items))
      .catch(() => setGurus([]));
  }, [categoryId, subCategoryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      setError("Please choose a category.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post<Requirement>("/requirements", {
        title,
        categoryId: subCategoryId || categoryId,
        description,
        budgetType,
        budgetAmount,
      });
      router.push("/student/requirements");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to post requirement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell role="STUDENT">
      <div className="page-header">
        <div className="eyebrow">Step 1 of 3 · Bidding flow</div>
        <h1>Post your training requirement</h1>
        <p>Tell us what you want to learn — matching gurus in this category will be notified automatically.</p>
      </div>

      <div className="grid grid-sidebar">
        <form className="card stack" onSubmit={handleSubmit}>
          <div className="field">
            <label>Title</label>
            <input
              type="text"
              placeholder="e.g. Need a React Native mentor for 6 weeks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-2">
            <div className="field autosuggest">
              <label>Category</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value ? Number(e.target.value) : "");
                  setSubCategoryId("");
                }}
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field autosuggest">
              <label>Sub-category</label>
              <select
                value={subCategoryId}
                onChange={(e) => setSubCategoryId(e.target.value ? Number(e.target.value) : "")}
                disabled={!categoryId || subCategories.length === 0}
              >
                <option value="">Select a sub-category</option>
                {subCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              placeholder="Describe your goals, current skill level, and what a successful outcome looks like."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="grid grid-3">
            <div className="field">
              <label>Skill level</label>
              <select>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div className="field">
              <label>Preferred duration</label>
              <select>
                <option>1–2 weeks</option>
                <option>3–6 weeks</option>
                <option>2–3 months</option>
                <option>Ongoing</option>
              </select>
            </div>
            <div className="field">
              <label>Budget (USD)</label>
              <input
                type="number"
                placeholder="e.g. 800"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
              <div className="hint">Minimum $3,000 total if paid via milestones</div>
            </div>
          </div>

          <div className="field">
            <label>Payment method</label>
            <div className="flex-gap">
              <label className={budgetType === "FIXED_MILESTONES" ? "badge badge-info" : "badge badge-neutral"} style={{ cursor: "pointer" }}>
                <input
                  type="radio"
                  name="pm"
                  checked={budgetType === "FIXED_MILESTONES"}
                  onChange={() => setBudgetType("FIXED_MILESTONES")}
                  style={{ marginRight: 6 }}
                />
                Milestones
              </label>
              <label className={budgetType === "FIXED_FULL_PAY" ? "badge badge-info" : "badge badge-neutral"} style={{ cursor: "pointer" }}>
                <input
                  type="radio"
                  name="pm"
                  checked={budgetType === "FIXED_FULL_PAY"}
                  onChange={() => setBudgetType("FIXED_FULL_PAY")}
                  style={{ marginRight: 6 }}
                />
                Pay after full training
              </label>
              <label className="badge badge-neutral" style={{ cursor: "not-allowed", opacity: 0.6 }}>
                <input type="radio" name="pm" disabled style={{ marginRight: 6 }} />
                Hourly (coming soon)
              </label>
            </div>
          </div>

          <div className="field">
            <label>Tags</label>
            <div>
              <span className="tag">React</span>
              <span className="tag">JavaScript</span>
              <span className="tag">1:1 mentorship</span>
            </div>
            <input type="text" placeholder="Add a tag and press enter" />
          </div>

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

          <hr className="divider" />
          <div className="flex-between">
            <span className="faint">Your post will be visible to matching gurus &amp; shown suggestions instantly.</span>
            <div className="flex-gap">
              <button type="button" className="btn btn-secondary">
                Save draft
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Posting…" : "Post requirement →"}
              </button>
            </div>
          </div>
        </form>

        <aside className="stack">
          <div className="card">
            <h3>Suggested gurus</h3>
            <p className="faint">Based on category + subcategory as you type</p>
            <div className="stack">
              {gurus === null ? (
                <div className="empty-state">
                  <div className="icon">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                  </div>
                  Loading…
                </div>
              ) : gurus.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">
                    <i className="fa-solid fa-user-magnifying-glass"></i>
                  </div>
                  No gurus matched yet.
                </div>
              ) : (
                gurus.map((g) => (
                  <div className="guru-card" key={g.userId}>
                    <div className="guru-photo">
                      {g.fullName
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <strong>{g.fullName}</strong>
                      <div className="stars">
                        {stars(g.ratingAvg).map((c, i) => (
                          <i key={i} className={`${c} fa-star`}></i>
                        ))}{" "}
                        <span className="faint">({g.ratingCount})</span>
                      </div>
                      <p className="faint" style={{ margin: "4px 0 0" }}>
                        {g.categoryName ?? g.headline}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/gurus" style={{ display: "block", marginTop: 14, fontSize: 13, fontWeight: 600 }}>
              See all suggested gurus →
            </Link>
          </div>

          <div className="card" style={{ background: "var(--color-primary-light)", borderColor: "var(--color-primary-light)" }}>
            <h3 style={{ color: "var(--color-primary-dark)" }}>Auto-notify</h3>
            <p className="faint">
              Once posted, gurus tagged under{" "}
              <strong>
                {categoryId
                  ? [categories.find((c) => c.id === categoryId)?.name, subCategories.find((c) => c.id === subCategoryId)?.name]
                      .filter(Boolean)
                      .join(" → ")
                  : "your chosen category"}
              </strong>{" "}
              receive an instant notification.
            </p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
