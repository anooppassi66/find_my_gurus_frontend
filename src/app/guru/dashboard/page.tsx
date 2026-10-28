"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Contract, Paginated, Proposal, Requirement, WalletMe } from "@/lib/types";
import { money, date } from "@/lib/format";

function isThisMonth(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function DashboardContent() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [contractDetails, setContractDetails] = useState<Contract[] | null>(null);
  const [wallet, setWallet] = useState<WalletMe | null>(null);
  const [openJobs, setOpenJobs] = useState<Paginated<Requirement> | null>(null);
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, w, o, p] = await Promise.all([
        api.get<Contract[]>("/contracts"),
        api.get<WalletMe>("/wallet/me"),
        api.get<Paginated<Requirement>>("/requirements/open"),
        api.get<Proposal[]>("/proposals/mine"),
      ]);
      setContracts(c);
      setWallet(w);
      setOpenJobs(o);
      setProposals(p);
      const details = await Promise.all(c.map((one) => api.get<Contract>(`/contracts/${one.id}`).catch(() => null)));
      setContractDetails(details.filter((d): d is Contract => d !== null));
    } catch {
      // leave sections showing empty/spinner states below
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeContracts = contracts?.filter((c) => c.status === "ACTIVE").length ?? null;
  const completedContracts = contracts?.filter((c) => c.status === "COMPLETED").length ?? 0;
  const earningsThisMonth = wallet
    ? wallet.transactions.items
        .filter((t) => t.type === "CREDIT" && t.reason === "MILESTONE_RELEASE" && isThisMonth(t.createdAt))
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    : null;
  const lifetimeEarnings = wallet
    ? wallet.transactions.items
        .filter((t) => t.type === "CREDIT" && t.reason === "MILESTONE_RELEASE")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    : 0;
  const openJobsTotal = openJobs?.total ?? null;
  const pendingProposals = proposals?.filter((p) => p.status === "PENDING").length ?? null;
  const acceptedProposals = proposals?.filter((p) => p.status === "ACCEPTED").length ?? 0;
  const teaserJobs = openJobs?.items.slice(0, 3) ?? [];

  type ActionItem = { key: string; title: string; sub: string; btnLabel: string; btnClass: string; href: string };
  const actionItems: ActionItem[] = [];
  (contractDetails ?? []).forEach((c) => {
    (c.milestones ?? []).forEach((m) => {
      if (m.status === "ACTIVE") {
        actionItems.push({
          key: `m-${m.id}-submit`,
          title: "Submit milestone deliverable",
          sub: `${m.name} · ${c.requirementTitle} (${c.studentName})`,
          btnLabel: "Open",
          btnClass: "btn btn-primary btn-sm",
          href: `/contracts/${c.id}`,
        });
      } else if (m.status === "PENDING_APPROVAL") {
        if (m.createdById === user?.id) {
          actionItems.push({
            key: `m-${m.id}-approve`,
            title: `Approve ${m.name}`,
            sub: `${c.requirementTitle} (${c.studentName})`,
            btnLabel: "Review",
            btnClass: "btn btn-secondary btn-sm",
            href: `/contracts/${c.id}`,
          });
        } else {
          actionItems.push({
            key: `m-${m.id}-review`,
            title: `${c.studentName} proposed a milestone`,
            sub: `${m.name} · ${c.requirementTitle}`,
            btnLabel: "Review",
            btnClass: "btn btn-secondary btn-sm",
            href: `/contracts/${c.id}`,
          });
        }
      }
    });
  });
  (proposals ?? []).forEach((p) => {
    if (p.status === "SHORTLISTED") {
      actionItems.push({
        key: `p-${p.id}`,
        title: `Shortlisted: ${p.requirementTitle ?? "Job"}`,
        sub: `Your proposal: ${money(p.proposedAmount)}`,
        btnLabel: "View",
        btnClass: "btn btn-secondary btn-sm",
        href: `/guru/jobs/${p.requirementId}`,
      });
    }
  });

  type ActivityItem = { key: string; when: string; icon: string; title: string; sub: string };
  const activity: ActivityItem[] = [];
  (wallet?.transactions.items ?? []).forEach((t) => {
    if (t.type === "CREDIT" && t.reason === "MILESTONE_RELEASE") {
      activity.push({
        key: `w-${t.id}`,
        when: t.createdAt,
        icon: "fa-sack-dollar",
        title: "Milestone payment cleared",
        sub: `${money(t.amount)} credited to wallet · ${date(t.createdAt)}`,
      });
    } else if (t.type === "DEBIT" && t.reason === "PAYOUT") {
      activity.push({
        key: `w-${t.id}`,
        when: t.createdAt,
        icon: "fa-money-bill-transfer",
        title: "Withdrawal processed",
        sub: `${money(t.amount)} paid out · ${date(t.createdAt)}`,
      });
    }
  });
  (proposals ?? []).forEach((p) => {
    if (p.status === "ACCEPTED") {
      activity.push({
        key: `p-${p.id}`,
        when: p.createdAt,
        icon: "fa-circle-check",
        title: "Proposal accepted",
        sub: `"${p.requirementTitle ?? "Job"}" — contract created · ${date(p.createdAt)}`,
      });
    } else {
      activity.push({
        key: `p-${p.id}`,
        when: p.createdAt,
        icon: "fa-paper-plane",
        title: "Proposal sent",
        sub: `"${p.requirementTitle ?? "Job"}" · ${date(p.createdAt)}`,
      });
    }
  });
  activity.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
  const recentActivity = activity.slice(0, 4);

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">Welcome back, {user?.fullName}</div>
        <h1>Dashboard</h1>
        <p>Here&apos;s what&apos;s happening across your contracts, proposals and messages today.</p>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Active contracts</div>
          <div className="kpi-value">{loading ? "…" : activeContracts ?? 0}</div>
          <div className="kpi-delta up">
            <i className="fa-solid fa-caret-up"></i> {loading ? "…" : `${completedContracts} completed`}
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">This month&apos;s earnings</div>
          <div className="kpi-value">{loading ? "…" : money(earningsThisMonth ?? 0)}</div>
          <div className="kpi-delta up">
            <i className="fa-solid fa-caret-up"></i> {loading ? "…" : `${money(lifetimeEarnings)} lifetime`}
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Open job matches</div>
          <div className="kpi-value">{loading ? "…" : openJobsTotal ?? 0}</div>
          <div className="kpi-delta up">
            <i className="fa-solid fa-caret-up"></i> across all categories
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Proposals pending</div>
          <div className="kpi-value">{loading ? "…" : pendingProposals ?? 0}</div>
          <div className="kpi-delta down">{loading ? "…" : `${acceptedProposals} accepted`}</div>
        </div>
      </div>

      <div className="grid grid-sidebar">
        <div className="stack">
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>Action needed</h3>
              <span className="badge badge-warning">{actionItems.length} {actionItems.length === 1 ? "item" : "items"}</span>
            </div>
            {loading ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </div>
                Loading…
              </div>
            ) : actionItems.length === 0 ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                You&apos;re all caught up.
              </div>
            ) : (
              <div className="stack">
                {actionItems.map((item, idx) => (
                  <div
                    key={item.key}
                    className="flex-between"
                    style={{
                      padding: "10px 0",
                      borderBottom: idx < actionItems.length - 1 ? "1px solid var(--color-border)" : undefined,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14 }}>{item.title}</strong>
                      <div className="faint">{item.sub}</div>
                    </div>
                    <Link href={item.href} className={item.btnClass}>
                      {item.btnLabel}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3>Recent activity</h3>
            {loading ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </div>
                Loading…
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                No recent activity yet.
              </div>
            ) : (
              <div className="stack">
                {recentActivity.map((item, idx) => (
                  <div
                    key={item.key}
                    className="flex-gap"
                    style={{
                      padding: "8px 0",
                      borderBottom: idx < recentActivity.length - 1 ? "1px solid var(--color-border)" : undefined,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>
                      <i className={`fa-solid ${item.icon}`}></i>
                    </span>
                    <div>
                      <strong style={{ fontSize: 13 }}>{item.title}</strong>
                      <div className="faint" style={{ fontSize: 12 }}>
                        {item.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>Jobs matching your skills</h3>
            </div>
            <p className="faint">Based on your categories and skills</p>
            {loading ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </div>
                Loading…
              </div>
            ) : teaserJobs.length === 0 ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-briefcase"></i>
                </div>
                No open jobs match your skills right now.
              </div>
            ) : (
              <div className="stack">
                {teaserJobs.map((job, idx) => (
                  <div
                    key={job.id}
                    style={{
                      padding: "10px 0",
                      borderBottom: idx < teaserJobs.length - 1 ? "1px solid var(--color-border)" : undefined,
                    }}
                  >
                    <Link href={`/guru/jobs/${job.id}`} style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>
                      {job.title}
                    </Link>
                    <div className="faint" style={{ fontSize: 12, margin: "2px 0 6px" }}>
                      {job.budgetType === "FIXED_MILESTONES" ? "Milestones" : "Fixed price"} · {money(job.budgetAmount)} · Posted {date(job.createdAt)}
                    </div>
                    <span className="tag">{job.categoryName}</span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/guru/browse-jobs" className="btn btn-secondary btn-block" style={{ marginTop: 14 }}>
              Browse all jobs →
            </Link>
          </div>
          <div className="card" style={{ background: "var(--color-primary-light)", borderColor: "var(--color-primary-light)" }}>
            <strong style={{ color: "var(--color-primary-dark)" }}>Proposals &amp; Connects</strong>
            <p className="faint" style={{ marginTop: 6 }}>
              You have <strong>8 connects</strong> remaining this cycle.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function GuruDashboardPage() {
  return (
    <DashboardShell role="GURU">
      <DashboardContent />
    </DashboardShell>
  );
}
