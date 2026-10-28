"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { date, money, stars } from "@/lib/format";
import { GuruSummary, Proposal, Requirement } from "@/lib/types";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function StudentRequirementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [gurus, setGurus] = useState<GuruSummary[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    api
      .get<Requirement>(`/requirements/${id}`)
      .then(setRequirement)
      .catch(() => setRequirement(null));
    api
      .get<Proposal[]>(`/requirements/${id}/proposals`)
      .then(setProposals)
      .catch(() => setProposals([]));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!requirement) return;
    api
      .get<{ items: GuruSummary[] }>(`/gurus?category=${requirement.categoryId}&pageSize=3`)
      .then((res) => setGurus(res.items))
      .catch(() => setGurus([]));
  }, [requirement]);

  async function act(proposalId: number, status: "SHORTLISTED" | "ACCEPTED") {
    setBusyId(proposalId);
    try {
      const res = await api.patch<Proposal>(`/proposals/${proposalId}`, { status });
      if (status === "ACCEPTED" && res.contractId) {
        router.push(`/contracts/${res.contractId}`);
        return;
      }
      load();
    } catch {
      // fall through, refetch to show current state
      load();
    } finally {
      setBusyId(null);
    }
  }

  if (!requirement) {
    return (
      <DashboardShell role="STUDENT">
        <div className="empty-state">
          <div className="icon">
            <i className="fa-solid fa-spinner fa-spin"></i>
          </div>
          Loading…
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="STUDENT">
      <div className="breadcrumb">
        <Link href="/student/requirements">My Requirements</Link>
        <span className="sep">/</span>
        {requirement.title}
      </div>
      <div className="page-header flex-between">
        <div>
          <div className="eyebrow">{requirement.categoryName}</div>
          <h1>{requirement.title}</h1>
          <p>
            Posted {date(requirement.createdAt)} · Budget {money(requirement.budgetAmount)} ·{" "}
            {requirement.budgetType === "FIXED_MILESTONES" ? "Milestones payment" : "Pay after full training"}
          </p>
        </div>
        <span style={{ alignSelf: "flex-start" }}>
          <StatusBadge status={requirement.status} />
        </span>
      </div>

      <div className="grid grid-sidebar">
        <div className="stack">
          <div className="card">
            <h3>Requirement details</h3>
            <p>{requirement.description}</p>
            <div className="grid grid-3" style={{ marginTop: 14 }}>
              <div>
                <div className="faint">Skill level</div>
                <strong>—</strong>
              </div>
              <div>
                <div className="faint">Duration</div>
                <strong>—</strong>
              </div>
              <div>
                <div className="faint">Payment method</div>
                <strong>
                  {requirement.budgetType === "FIXED_MILESTONES" ? "Milestones" : "Full pay after training"}
                </strong>
              </div>
            </div>
            <hr className="divider" />
            <div className="flex-gap">
              <Link href="/student/post-requirement" className="btn btn-secondary btn-sm">
                Edit requirement
              </Link>
              <button className="btn btn-danger btn-sm">Close requirement</button>
            </div>
          </div>

          <div className="card">
            <h3>Suggested gurus</h3>
            <p className="faint">Matched from category + sub-category</p>
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
                  No suggested gurus yet.
                </div>
              ) : (
                gurus.map((g) => (
                  <div className="guru-card" key={g.userId}>
                    <div className="guru-photo">{initialsOf(g.fullName)}</div>
                    <div style={{ flex: 1 }}>
                      <strong>{g.fullName}</strong>
                      <div className="stars">
                        {stars(g.ratingAvg).map((c, i) => (
                          <i key={i} className={`${c} fa-star`}></i>
                        ))}{" "}
                        <span className="faint">
                          {g.ratingAvg ?? 0} ({g.ratingCount})
                        </span>
                      </div>
                      <p className="faint" style={{ margin: "4px 0 0" }}>
                        {g.categoryName}
                      </p>
                    </div>
                    <Link className="btn btn-secondary btn-sm" href="#" style={{ alignSelf: "center" }}>
                      Message
                    </Link>
                  </div>
                ))
              )}
            </div>
            <Link href="/gurus" style={{ display: "block", marginTop: 12, fontSize: 13, fontWeight: 600 }}>
              See all suggested gurus →
            </Link>
          </div>

          <div className="card">
            <div className="flex-between" style={{ marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>Proposals received</h3>
              <span className="badge badge-neutral">{proposals?.length ?? 0} proposals</span>
            </div>
            <div className="stack">
              {proposals === null ? (
                <div className="empty-state">
                  <div className="icon">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                  </div>
                  Loading…
                </div>
              ) : proposals.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">
                    <i className="fa-solid fa-inbox"></i>
                  </div>
                  No proposals yet.
                </div>
              ) : (
                proposals.map((p) => (
                  <div className="guru-card" style={{ alignItems: "flex-start" }} key={p.id}>
                    <div className="guru-photo">{initialsOf(p.guruName ?? "?")}</div>
                    <div style={{ flex: 1 }}>
                      <div className="flex-between">
                        <div>
                          <strong>{p.guruName}</strong>{" "}
                          {p.status !== "PENDING" && <StatusBadge status={p.status} />}
                        </div>
                        <strong style={{ color: "var(--color-primary)" }}>{money(p.proposedAmount)} total</strong>
                      </div>
                      <p className="faint" style={{ margin: "6px 0 8px" }}>
                        "{p.coverLetter}"
                      </p>
                      <div className="flex-gap">
                        <Link href="#" className="btn btn-secondary btn-sm">
                          Message
                        </Link>
                        {p.status === "PENDING" && (
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={busyId === p.id}
                            onClick={() => act(p.id, "SHORTLISTED")}
                          >
                            Shortlist
                          </button>
                        )}
                        {(p.status === "PENDING" || p.status === "SHORTLISTED") && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={busyId === p.id}
                            onClick={() => act(p.id, "ACCEPTED")}
                          >
                            Accept &amp; hire
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="card" style={{ background: "var(--color-primary-light)", borderColor: "var(--color-primary-light)" }}>
            <h3 style={{ color: "var(--color-primary-dark)" }}>Auto-notify active</h3>
            <p className="faint">
              Gurus tagged under {requirement.categoryName} still receive instant notifications while this
              requirement is open.
            </p>
          </div>
          <div className="card">
            <h3>Requirement stats</h3>
            <table>
              <tbody>
                <tr>
                  <td>Views</td>
                  <td style={{ textAlign: "right" }}>—</td>
                </tr>
                <tr>
                  <td>Proposals</td>
                  <td style={{ textAlign: "right" }}>{proposals?.length ?? 0}</td>
                </tr>
                <tr>
                  <td>Shortlisted</td>
                  <td style={{ textAlign: "right" }}>
                    {proposals?.filter((p) => p.status === "SHORTLISTED").length ?? 0}
                  </td>
                </tr>
                <tr>
                  <td>Avg. proposal</td>
                  <td style={{ textAlign: "right" }}>
                    {proposals && proposals.length > 0
                      ? money(
                          proposals.reduce((sum, p) => sum + parseFloat(p.proposedAmount), 0) / proposals.length
                        )
                      : "$0.00"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3>Not finding the right fit?</h3>
            <p className="faint">Invite a trainer who isn't on Find My Gurus yet.</p>
            <Link href="#" className="btn btn-secondary btn-block">
              Invite a trainer
            </Link>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
