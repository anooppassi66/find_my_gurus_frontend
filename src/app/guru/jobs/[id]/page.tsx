"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardShell, { initials } from "@/components/DashboardShell";
import StatusBadge from "@/components/StatusBadge";
import { api, ApiError } from "@/lib/api";
import { Proposal, Requirement } from "@/lib/types";
import { money, date } from "@/lib/format";

function JobDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [myProposal, setMyProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [coverLetter, setCoverLetter] = useState(
    "Hi! I'd love to help with this. I'll share my relevant experience and a proposed approach here."
  );
  const [proposedAmount, setProposedAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [req, mine] = await Promise.all([
        api.get<Requirement>(`/requirements/${params.id}`),
        api.get<Proposal[]>("/proposals/mine"),
      ]);
      setRequirement(req);
      const existing = mine.find((p) => p.requirementId === Number(params.id));
      setMyProposal(existing ?? null);
      if (!proposedAmount) setProposedAmount(req.budgetAmount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmitProposal(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.post<Proposal>(`/requirements/${params.id}/proposals`, {
        coverLetter,
        proposedAmount,
      });
      router.push("/guru/proposals");
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="icon">
          <i className="fa-solid fa-spinner fa-spin"></i>
        </div>
        Loading…
      </div>
    );
  }

  if (error || !requirement) {
    return (
      <div className="empty-state">
        <div className="icon">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        {error ?? "Job not found."}
      </div>
    );
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href="/guru/browse-jobs">Browse Jobs</Link>
        <span className="sep">/</span>Job detail
      </div>

      <div className="page-header" style={{ paddingTop: 0 }}>
        <div className="eyebrow">
          Posted {date(requirement.createdAt)} · {requirement.categoryName}
        </div>
        <h1>{requirement.title}</h1>
        <p>Posted by {requirement.studentName}</p>
      </div>

      <div className="grid grid-sidebar">
        <div className="stack">
          <div className="card">
            <h3>Description</h3>
            <p>{requirement.description}</p>
            <div className="flex-gap" style={{ marginTop: 16, flexWrap: "wrap" }}>
              <span className="tag">{requirement.categoryName}</span>
            </div>
          </div>

          <div className="card">
            <h3>Proposals so far</h3>
            <div className="flex-between" style={{ padding: "8px 0" }}>
              <span className="faint">{requirement.proposalCount ?? 0} proposals submitted</span>
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <table>
              <tbody>
                <tr>
                  <td>Budget</td>
                  <td style={{ textAlign: "right" }}>
                    <strong>{money(requirement.budgetAmount)}</strong>
                  </td>
                </tr>
                <tr>
                  <td>Payment method</td>
                  <td style={{ textAlign: "right" }}>
                    <span className="badge badge-info">
                      {requirement.budgetType === "FIXED_MILESTONES" ? "Milestones" : "Full pay after training"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Duration</td>
                  <td style={{ textAlign: "right" }}>—</td>
                </tr>
                <tr>
                  <td>Skill level required</td>
                  <td style={{ textAlign: "right" }}>—</td>
                </tr>
                <tr>
                  <td>Proposals</td>
                  <td style={{ textAlign: "right" }}>{requirement.proposalCount ?? 0}</td>
                </tr>
              </tbody>
            </table>
            {!myProposal && (
              <a href="#proposal-form" className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
                Submit a proposal
              </a>
            )}
            <p className="faint" style={{ textAlign: "center", marginTop: 8 }}>
              Uses 1 connect · 8 remaining
            </p>
          </div>
          <div className="card">
            <h3>About the poster</h3>
            <div className="flex-gap">
              <div className="guru-photo">{initials(requirement.studentName)}</div>
              <div>
                <strong>{requirement.studentName}</strong>
                <div className="faint">Student on Find My Gurus</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="page-header" style={{ paddingTop: 0 }} id="proposal-form">
        <div className="eyebrow">
          {requirement.title} · Budget {money(requirement.budgetAmount)}
        </div>
        <h1>{myProposal ? "Your proposal" : "Submit a proposal"}</h1>
        <p>{myProposal ? "You've already submitted a proposal for this job." : "Submitting uses 1 connect. You have 8 remaining this cycle."}</p>
      </div>

      <div className="grid grid-sidebar">
        {myProposal ? (
          <div className="card stack">
            <div className="flex-between" style={{ marginBottom: 4 }}>
              <h3 style={{ margin: 0 }}>Your cover letter</h3>
              <StatusBadge status={myProposal.status} />
            </div>
            <p style={{ whiteSpace: "pre-line" }}>{myProposal.coverLetter}</p>

            <div className="grid grid-2">
              <div className="field">
                <label>Proposed amount (USD)</label>
                <input type="number" value={myProposal.proposedAmount} disabled />
              </div>
              <div className="field">
                <label>Submitted</label>
                <input type="text" value={date(myProposal.createdAt)} disabled />
              </div>
            </div>

            <hr className="divider" />

            <div className="flex-between" style={{ marginBottom: 4 }}>
              <h3 style={{ margin: 0 }}>Proposed milestones</h3>
              <span className="faint">Total: {money(myProposal.proposedAmount)}</span>
            </div>
            <p className="faint">Milestones are agreed with the student after the proposal is accepted.</p>

            <hr className="divider" />

            <div className="field">
              <label>Attachments</label>
              <div className="dropzone">
                <i className="fa-solid fa-paperclip"></i> No attachments were sent with this proposal
              </div>
            </div>
          </div>
        ) : (
          <form className="card stack" onSubmit={onSubmitProposal}>
            {submitError && (
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
                {submitError}
              </div>
            )}

            <div className="field">
              <label>Cover letter</label>
              <textarea
                style={{ minHeight: 140 }}
                placeholder="Introduce yourself, your relevant experience, and your approach to this job."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            <div className="grid grid-2">
              <div className="field">
                <label>Proposed amount (USD)</label>
                <input
                  type="number"
                  min={0}
                  value={proposedAmount}
                  onChange={(e) => setProposedAmount(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Estimated timeline</label>
                <select defaultValue="6 weeks">
                  <option>1–2 weeks</option>
                  <option>3–6 weeks</option>
                  <option>6 weeks</option>
                  <option>2–3 months</option>
                  <option>Ongoing</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Payment method</label>
              <div className="flex-gap" style={{ flexWrap: "wrap" }}>
                <label className="badge badge-info" style={{ cursor: "pointer" }}>
                  <input type="radio" name="pm" defaultChecked style={{ marginRight: 6 }} />
                  Fixed → milestones
                </label>
                <label className="badge badge-neutral" style={{ cursor: "pointer" }}>
                  <input type="radio" name="pm" style={{ marginRight: 6 }} />
                  Full pay after training
                </label>
                <label className="badge badge-neutral" style={{ cursor: "not-allowed", opacity: 0.6 }}>
                  <input type="radio" name="pm" disabled style={{ marginRight: 6 }} />
                  Hourly (coming soon)
                </label>
              </div>
            </div>

            <hr className="divider" />

            <div className="flex-between" style={{ marginBottom: 4 }}>
              <h3 style={{ margin: 0 }}>Proposed milestones</h3>
              <span className="faint">Total: {money(proposedAmount || 0)}</span>
            </div>
            <div className="stack" id="milestone-rows">
              <div className="card" style={{ background: "var(--color-surface-alt)", boxShadow: "none" }}>
                <div className="grid grid-2">
                  <div className="field">
                    <label>Milestone name</label>
                    <input type="text" defaultValue="Kickoff & planning" />
                  </div>
                  <div className="field">
                    <label>Amount (USD)</label>
                    <input type="number" defaultValue="400" />
                  </div>
                  <div className="field">
                    <label>Start date</label>
                    <input type="date" />
                  </div>
                  <div className="field">
                    <label>End date</label>
                    <input type="date" />
                  </div>
                </div>
              </div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>
              + Add milestone
            </button>
            <div className="hint">
              Minimum milestone amount is <strong>$3,000</strong> total per contract (configurable) unless paid via full-pay-after-training.
            </div>

            <hr className="divider" />

            <div className="field">
              <label>Attachments</label>
              <div className="dropzone">
                <i className="fa-solid fa-paperclip"></i> Drag &amp; drop files here, or <strong style={{ color: "var(--color-primary)" }}>browse</strong>
                <br />
                <span className="faint">Sample lesson plans, portfolio PDFs, certificates (max 10MB each)</span>
              </div>
            </div>

            <hr className="divider" />
            <div className="flex-between">
              <span className="faint">This will use 1 of your 8 remaining connects.</span>
              <div className="flex-gap">
                <button type="button" className="btn btn-secondary">
                  Save draft
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit proposal →"}
                </button>
              </div>
            </div>
          </form>
        )}

        <aside className="stack">
          <div className="card">
            <h3>Job summary</h3>
            <p className="faint">{requirement.title}</p>
            <table>
              <tbody>
                <tr>
                  <td>Budget</td>
                  <td style={{ textAlign: "right" }}>{money(requirement.budgetAmount)}</td>
                </tr>
                <tr>
                  <td>Payment method</td>
                  <td style={{ textAlign: "right" }}>
                    <span className="badge badge-info">
                      {requirement.budgetType === "FIXED_MILESTONES" ? "Milestones" : "Full pay after training"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Duration</td>
                  <td style={{ textAlign: "right" }}>—</td>
                </tr>
              </tbody>
            </table>
            <a href="#top" style={{ display: "block", marginTop: 10, fontSize: 13, fontWeight: 600 }}>
              ← Back to job detail
            </a>
          </div>
          <div className="card" style={{ background: "var(--color-warning-bg)", borderColor: "var(--color-warning-bg)" }}>
            <strong style={{ color: "var(--color-warning)" }}>Tip</strong>
            <p className="faint" style={{ marginTop: 6 }}>
              Proposals with a clear milestone breakdown are shortlisted 2× more often.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function GuruJobDetailPage() {
  return (
    <DashboardShell role="GURU">
      <JobDetailContent />
    </DashboardShell>
  );
}
