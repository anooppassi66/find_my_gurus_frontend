"use client";

import { useEffect, useState, useCallback, useMemo, FormEvent } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CommissionBand, Contract, Milestone, WalletMe, WalletTransaction } from "@/lib/types";
import { money, date } from "@/lib/format";

type MilestoneEntry = { milestone: Milestone; contract: Contract };

function commissionFor(amount: number, bands: CommissionBand[]) {
  const band = bands.find((b) => {
    const min = parseFloat(b.minAmount);
    const max = b.maxAmount === null ? null : parseFloat(b.maxAmount);
    return amount >= min && (max === null || amount < max);
  });
  const ratePct = band ? parseFloat(band.ratePct) : 0;
  return { ratePct, commission: (amount * ratePct) / 100 };
}

function txDescription(t: WalletTransaction, milestoneMap: Map<number, MilestoneEntry>, isGuru: boolean) {
  const entry = t.milestoneId ? milestoneMap.get(t.milestoneId) : undefined;
  const mName = entry?.milestone.name;
  switch (t.reason) {
    case "TOPUP":
      return "Wallet top-up";
    case "MILESTONE_ESCROW":
      return mName ? `Milestone escrow — ${mName}` : t.description || "Milestone escrow";
    case "MILESTONE_RELEASE": {
      const base = mName ? `Milestone released — ${mName}` : t.description || "Milestone released";
      if (isGuru && entry?.milestone.commissionPct != null) {
        return `${base} (net of ${parseFloat(entry.milestone.commissionPct).toString()}% commission)`;
      }
      return base;
    }
    case "REFUND":
      return mName ? `Refund — ${mName}` : t.description || "Refund";
    case "PAYOUT":
      return "Payout to bank account";
    default:
      return t.description || t.reason.replace(/_/g, " ");
  }
}

function WalletContent() {
  const { user } = useAuth();
  const isStudent = user?.role !== "GURU";
  const [wallet, setWallet] = useState<WalletMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [bands, setBands] = useState<CommissionBand[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<WalletMe>("/wallet/me");
      setWallet(res);
    } catch {
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContracts = useCallback(async () => {
    try {
      const list = await api.get<Contract[]>("/contracts");
      const detailed = await Promise.all(list.map((c) => api.get<Contract>(`/contracts/${c.id}`).catch(() => c)));
      setContracts(detailed);
    } catch {
      setContracts([]);
    }
  }, []);

  useEffect(() => {
    load();
    loadContracts();
    api
      .get<CommissionBand[]>("/commission/bands")
      .then(setBands)
      .catch(() => setBands([]));
  }, [load, loadContracts]);

  const milestoneEntries: MilestoneEntry[] = useMemo(
    () => (contracts ?? []).flatMap((c) => (c.milestones ?? []).map((m) => ({ milestone: m, contract: c }))),
    [contracts]
  );

  const milestoneMap: Map<number, MilestoneEntry> = useMemo(() => {
    const map = new Map<number, MilestoneEntry>();
    for (const entry of milestoneEntries) map.set(entry.milestone.id, entry);
    return map;
  }, [milestoneEntries]);

  const submittedMilestones = milestoneEntries.filter((e) => e.milestone.status === "SUBMITTED");

  const heldInMilestones = milestoneEntries
    .filter((e) => e.milestone.status === "ACTIVE" || e.milestone.status === "SUBMITTED")
    .reduce((sum, e) => sum + parseFloat(e.milestone.amount), 0);

  const pendingClearance = submittedMilestones.reduce((sum, e) => {
    const amt = parseFloat(e.milestone.amount);
    return sum + (amt - commissionFor(amt, bands).commission);
  }, 0);

  const commissionPaidLifetime = milestoneEntries
    .filter((e) => e.milestone.status === "RELEASED")
    .reduce((sum, e) => sum + (parseFloat(e.milestone.amount) * (parseFloat(e.milestone.commissionPct ?? "0") || 0)) / 100, 0);

  const now = new Date();
  const releasedThisMonth = milestoneEntries.filter((e) => {
    if (e.milestone.status !== "RELEASED") return false;
    const d = new Date(e.milestone.updatedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const commissionThisMonth = releasedThisMonth.reduce(
    (sum, e) => sum + (parseFloat(e.milestone.amount) * (parseFloat(e.milestone.commissionPct ?? "0") || 0)) / 100,
    0
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const path = isStudent ? "/wallet/topup" : "/wallet/withdraw";
      await api.post<{ balance: string }>(path, { amount });
      setAmount("");
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function releaseMilestone(id: number) {
    setReleasingId(id);
    try {
      await api.post(`/milestones/${id}/release`);
      await Promise.all([load(), loadContracts()]);
    } catch {
      // ignore; user can retry
    } finally {
      setReleasingId(null);
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

  if (!wallet) {
    return (
      <div className="empty-state">
        <div className="icon">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        Failed to load your wallet.
      </div>
    );
  }

  const transactions = wallet.transactions.items;
  const payoutTransactions = transactions
    .filter((t) => t.reason === "PAYOUT")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latestPayout = payoutTransactions[0];

  return isStudent ? (
    <>
      <div className="page-header">
        <div className="eyebrow">Student dashboard</div>
        <h1>Wallet</h1>
        <p>Fund milestones, approve or reject charges, and receive refunds if a contract fails.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-tile">
          <div className="value">{money(wallet.balance)}</div>
          <div className="label">Wallet balance</div>
        </div>
        <div className="stat-tile">
          <div className="value">{contracts ? money(heldInMilestones) : "…"}</div>
          <div className="label">Held in active milestones</div>
        </div>
        <div className="stat-tile">
          <div className="value">$0.00</div>
          <div className="label">Refunds pending</div>
        </div>
      </div>

      <div className="grid grid-sidebar">
        <div className="stack">
          <div className="card flex-between">
            <div>
              <strong>Add funds</strong>
              <p className="faint" style={{ margin: "2px 0 0" }}>
                Top up your wallet from a card or bank account
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
              + Add funds
            </button>
          </div>

          {showForm && (
            <form className="card stack" onSubmit={onSubmit}>
              {formError && (
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
                  {formError}
                </div>
              )}
              <div className="field">
                <label>Amount</label>
                <input type="number" placeholder="e.g. 1000" min={10} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="flex-between">
                <span className="faint">Funds are added instantly and available for milestone payments right away.</span>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? "Adding…" : "Add funds →"}
                </button>
              </div>
            </form>
          )}

          {submittedMilestones.map(({ milestone: m, contract: c }) => (
            <div className="card" key={m.id}>
              <div className="flex-between">
                <strong>Payment approval — {m.name}</strong>
                <span className="badge badge-warning">Action needed</span>
              </div>
              <p className="faint" style={{ margin: "6px 0 14px" }}>
                {c.guruName} submitted {m.name} for release: <strong>{money(m.amount)}</strong>
              </p>
              <div className="flex-gap" style={{ justifyContent: "flex-end" }}>
                <Link href={`/contracts/${c.id}`} className="btn btn-secondary">
                  Review
                </Link>
                <button className="btn btn-primary" disabled={releasingId === m.id} onClick={() => releaseMilestone(m.id)}>
                  {releasingId === m.id ? "Releasing…" : "Approve & release"}
                </button>
              </div>
            </div>
          ))}

          <div className="card card-flush">
            {transactions.length === 0 ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                No transactions yet.
              </div>
            ) : (
              <table>
                <tbody>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th>Status</th>
                  </tr>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{date(t.createdAt)}</td>
                      <td>{txDescription(t, milestoneMap, false)}</td>
                      <td>
                        <span className={`badge ${t.type === "CREDIT" ? "badge-success" : "badge-danger"}`}>
                          {t.type === "CREDIT" ? "Credit" : "Debit"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {t.type === "CREDIT" ? "+ " : "– "}
                        {money(t.amount)}
                      </td>
                      <td>
                        <span className="badge badge-info">Cleared</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside className="stack">
          <div className="card" style={{ background: "var(--color-danger-bg)", borderColor: "var(--color-danger-bg)" }}>
            <strong style={{ color: "var(--color-danger)" }}>If a contract fails</strong>
            <p className="faint" style={{ marginTop: 6 }}>
              Any milestone funds not yet released to the guru are refunded back to your wallet automatically.
            </p>
          </div>
          <div className="card">
            <h3>Linked payment methods</h3>
            <div className="flex-between" style={{ padding: "8px 0" }}>
              <span>Visa ••4242</span>
              <span className="badge badge-neutral">Default</span>
            </div>
            <div className="flex-between" style={{ padding: "8px 0" }}>
              <span>Bank ••7788</span>
              <a href="#" style={{ fontSize: 13 }}>
                Set default
              </a>
            </div>
            <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 8 }}>
              + Add payment method
            </button>
          </div>
        </aside>
      </div>
    </>
  ) : (
    <>
      <div className="page-header">
        <div className="eyebrow">Guru dashboard</div>
        <h1>Wallet</h1>
        <p>Track earnings, commission deductions and payout requests.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-tile">
          <div className="value">{money(wallet.balance)}</div>
          <div className="label">Available balance</div>
        </div>
        <div className="stat-tile">
          <div className="value">{contracts ? money(pendingClearance) : "…"}</div>
          <div className="label">Pending clearance</div>
        </div>
        <div className="stat-tile">
          <div className="value">{contracts ? money(commissionPaidLifetime) : "…"}</div>
          <div className="label">Commission paid (lifetime)</div>
        </div>
      </div>

      <div className="grid grid-sidebar">
        <div className="stack">
          <div className="card flex-between">
            <div>
              <strong>Request payout</strong>
              <p className="faint" style={{ margin: "2px 0 0" }}>
                Move funds from wallet to your linked bank account
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
              + Request payout
            </button>
          </div>

          {showForm && (
            <form className="card stack" onSubmit={onSubmit}>
              {formError && (
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
                  {formError}
                </div>
              )}
              <div className="field">
                <label>Withdraw amount (USD)</label>
                <input type="number" placeholder="e.g. 2000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <div className="hint">Available balance: {money(wallet.balance)}</div>
              </div>
              <div className="flex-between">
                <span className="faint">Withdrawals are processed within 3–5 business days after approval.</span>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit withdrawal request"}
                </button>
              </div>
            </form>
          )}

          <div className="card card-flush">
            {transactions.length === 0 ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                No transactions yet.
              </div>
            ) : (
              <table>
                <tbody>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th>Status</th>
                  </tr>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{date(t.createdAt)}</td>
                      <td>{txDescription(t, milestoneMap, true)}</td>
                      <td>
                        <span className={`badge ${t.type === "CREDIT" ? "badge-success" : "badge-danger"}`}>
                          {t.type === "CREDIT" ? "Credit" : "Debit"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {t.type === "CREDIT" ? "+ " : "– "}
                        {money(t.amount)}
                      </td>
                      <td>
                        <span className="badge badge-info">Cleared</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <h3>Payout request</h3>
            <p className="faint">Wallet → Bank account ••1234</p>
            {latestPayout ? (
              <>
                <div className="milestone" style={{ padding: "10px 0" }}>
                  <div className="milestone-dot done"></div>
                  <div>
                    <strong style={{ fontSize: 13 }}>Requested</strong>
                    <div className="faint" style={{ fontSize: 12 }}>
                      {date(latestPayout.createdAt)}
                    </div>
                  </div>
                  <div></div>
                </div>
                <div className="milestone" style={{ padding: "10px 0" }}>
                  <div className="milestone-dot active"></div>
                  <div>
                    <strong style={{ fontSize: 13 }}>Admin review</strong>
                    <div className="faint" style={{ fontSize: 12 }}>
                      Approve / reject
                    </div>
                  </div>
                  <div></div>
                </div>
                <div className="milestone" style={{ padding: "10px 0", borderBottom: "none" }}>
                  <div className="milestone-dot"></div>
                  <div>
                    <strong style={{ fontSize: 13 }}>Funds transferred</strong>
                  </div>
                  <div></div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-money-bill-transfer"></i>
                </div>
                No payout requests yet.
              </div>
            )}
          </div>
          <div className="card">
            <h3>Commission this month</h3>
            <div className="value" style={{ fontSize: 22, fontWeight: 800 }}>
              {contracts ? money(commissionThisMonth) : "…"}
            </div>
            <p className="faint">Across {releasedThisMonth.length} cleared milestone(s)</p>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function WalletPage() {
  return (
    <DashboardShell>
      <WalletContent />
    </DashboardShell>
  );
}
