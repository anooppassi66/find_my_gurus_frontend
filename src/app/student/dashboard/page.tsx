"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardShell, { initials } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { money, stars } from "@/lib/format";
import { Contract, ConversationSummary, GuruSummary, Requirement, WalletMe, WalletTransaction } from "@/lib/types";

function activityText(t: WalletTransaction) {
  switch (t.reason) {
    case "TOPUP":
      return (
        <>
          Wallet top-up of <strong>{money(t.amount)}</strong> cleared
        </>
      );
    case "MILESTONE_ESCROW":
      return (
        <>
          <strong>{money(t.amount)}</strong> moved to escrow for a milestone
        </>
      );
    case "MILESTONE_RELEASE":
      return (
        <>
          <strong>{money(t.amount)}</strong> released from escrow
        </>
      );
    case "REFUND":
      return (
        <>
          Refund of <strong>{money(t.amount)}</strong>
        </>
      );
    case "PAYOUT":
      return (
        <>
          Payout of <strong>{money(t.amount)}</strong> requested
        </>
      );
    default:
      return t.description || "Wallet activity";
  }
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [wallet, setWallet] = useState<WalletMe | null>(null);
  const [requirements, setRequirements] = useState<Requirement[] | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [gurus, setGurus] = useState<GuruSummary[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get<Contract[]>("/contracts")
      .then(async (list) => {
        const detailed = await Promise.all(
          list.map((c) => api.get<Contract>(`/contracts/${c.id}`).catch(() => c))
        );
        setContracts(detailed);
      })
      .catch(() => setContracts([]));
    api
      .get<WalletMe>("/wallet/me")
      .then(setWallet)
      .catch(() => setWallet(null));
    api
      .get<Requirement[]>("/requirements/mine")
      .then(setRequirements)
      .catch(() => setRequirements([]));
    api
      .get<ConversationSummary[]>("/conversations")
      .then(setConversations)
      .catch(() => setConversations([]));
    api
      .get<{ items: GuruSummary[] }>("/gurus?pageSize=2")
      .then((res) => setGurus(res.items))
      .catch(() => setGurus([]));
  }, [user]);

  const activeContracts = contracts?.filter((c) => c.status === "ACTIVE") ?? [];
  const completedContracts = contracts?.filter((c) => c.status === "COMPLETED") ?? [];
  const openRequirements = requirements?.filter((r) => r.status === "OPEN") ?? [];

  const milestoneRows = (contracts ?? []).flatMap((c) => (c.milestones ?? []).map((m) => ({ milestone: m, contract: c })));

  const heldInMilestones = milestoneRows
    .filter((r) => r.milestone.status === "ACTIVE" || r.milestone.status === "SUBMITTED")
    .reduce((sum, r) => sum + parseFloat(r.milestone.amount), 0);

  type ActionItem = {
    key: string;
    title: string;
    sub: string;
    href: string;
    btnClass: string;
  };

  const actionItems: ActionItem[] = [];
  for (const { milestone: m, contract: c } of milestoneRows) {
    if (m.status === "SUBMITTED") {
      actionItems.push({
        key: `submitted-${m.id}`,
        title: `${m.name} submitted for release`,
        sub: `${c.guruName} · ${c.requirementTitle} — ${money(m.amount)}`,
        href: `/contracts/${c.id}`,
        btnClass: "btn btn-primary btn-sm",
      });
    } else if (m.status === "PENDING_APPROVAL") {
      if (m.createdById === user?.id) {
        actionItems.push({
          key: `approve-${m.id}`,
          title: `Approve ${m.name}`,
          sub: `${c.guruName} · ${c.requirementTitle} — ${money(m.amount)}`,
          href: `/contracts/${c.id}`,
          btnClass: "btn btn-secondary btn-sm",
        });
      } else {
        actionItems.push({
          key: `proposed-${m.id}`,
          title: `${c.guruName} proposed a milestone`,
          sub: `${m.name} · ${c.requirementTitle} — ${money(m.amount)}`,
          href: `/contracts/${c.id}`,
          btnClass: "btn btn-secondary btn-sm",
        });
      }
    }
  }

  const recentTransactions = wallet
    ? [...wallet.transactions.items]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4)
    : [];

  return (
    <DashboardShell role="STUDENT">
      <div className="page-header">
        <div className="eyebrow">Welcome back</div>
        <h1>
          Hi, {user?.fullName} <i className="fa-solid fa-hand"></i>
        </h1>
        <p>Here's what's happening across your requirements, contracts and payments.</p>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-tile">
          <div className="kpi-label">Active contracts</div>
          <div className="kpi-value">{contracts ? activeContracts.length : "…"}</div>
          <div className="kpi-delta up">
            <i className="fa-solid fa-caret-up"></i> {contracts ? completedContracts.length : "…"} completed
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Wallet balance</div>
          <div className="kpi-value">{wallet ? money(wallet.balance) : "…"}</div>
          <div className="kpi-delta down">
            <i className="fa-solid fa-caret-down"></i> {contracts ? money(heldInMilestones) : "…"} held in milestones
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Open requirements</div>
          <div className="kpi-value">{requirements ? openRequirements.length : "…"}</div>
          <div className="kpi-delta up">
            <i className="fa-solid fa-caret-up"></i> {requirements ? requirements.length : "…"} total posted
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Conversations</div>
          <div className="kpi-value">{conversations ? conversations.length : "…"}</div>
          <div className="kpi-delta up">
            <i className="fa-solid fa-comments"></i> with gurus
          </div>
        </div>
      </div>

      <div className="grid grid-sidebar">
        <div className="stack">
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>Action needed</h3>
              <span className="badge badge-warning">{actionItems.length} {actionItems.length === 1 ? "item" : "items"}</span>
            </div>
            {contracts === null ? (
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
                You're all caught up
              </div>
            ) : (
              <div className="stack">
                {actionItems.map((item, i) => (
                  <div
                    key={item.key}
                    className="flex-between"
                    style={{
                      padding: "12px 0",
                      borderBottom: i === actionItems.length - 1 ? "none" : "1px solid var(--color-border)",
                    }}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <div className="faint">{item.sub}</div>
                    </div>
                    <Link href={item.href} className={item.btnClass}>
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3>Recent activity</h3>
            {wallet === null ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </div>
                Loading…
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                No recent activity yet.
              </div>
            ) : (
              <div className="stack">
                {recentTransactions.map((t) => (
                  <div className="flex-gap" style={{ padding: "8px 0" }} key={t.id}>
                    <div className="guru-photo" style={{ width: 36, height: 36, fontSize: 12 }}>
                      $
                    </div>
                    <div style={{ flex: 1 }}>
                      {activityText(t)} <span className="faint">· {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <h3>Suggested gurus</h3>
            <p className="faint">Matched to your open requirement</p>
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
              <div className="stack">
                {gurus.map((g) => (
                  <Link
                    href={`/gurus/${g.userId}`}
                    className="guru-card"
                    key={g.userId}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="guru-photo">{initials(g.fullName)}</div>
                    <div>
                      <strong>{g.fullName}</strong>
                      <div className="stars">
                        {stars(g.ratingAvg).map((c, i) => (
                          <i key={i} className={`${c} fa-star`}></i>
                        ))}{" "}
                        <span className="faint">({g.ratingCount})</span>
                      </div>
                      <p className="faint" style={{ margin: "4px 0 0" }}>
                        {g.categoryName ?? g.headline ?? "—"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/gurus" style={{ display: "block", marginTop: 14, fontSize: 13, fontWeight: 600 }}>
              See all suggested gurus →
            </Link>
          </div>
          <div className="card" style={{ background: "var(--color-primary-light)", borderColor: "var(--color-primary-light)" }}>
            <h3 style={{ color: "var(--color-primary-dark)" }}>Post a new requirement</h3>
            <p className="faint">Get matched with gurus in minutes.</p>
            <Link href="/student/post-requirement" className="btn btn-primary btn-block">
              + Post Requirement
            </Link>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
