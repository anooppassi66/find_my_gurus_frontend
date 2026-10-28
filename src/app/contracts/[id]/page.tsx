"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import StatusBadge from "@/components/StatusBadge";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { date, money } from "@/lib/format";
import { CommissionCalculation, Contract, Milestone } from "@/lib/types";

function dotClass(status: Milestone["status"]) {
  if (status === "RELEASED") return "milestone-dot done";
  if (status === "ACTIVE" || status === "SUBMITTED") return "milestone-dot active";
  return "milestone-dot";
}

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<{ id: number; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [commission, setCommission] = useState<CommissionCalculation | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const c = await api.get<Contract>(`/contracts/${params.id}`);
      setContract(c);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Failed to load contract");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const milestones = contract?.milestones ?? [];

  // Payout breakdown: the milestone currently being edited/added, or the latest milestone.
  useEffect(() => {
    const amountForCalc =
      formAmount || (milestones.length > 0 ? milestones[milestones.length - 1].amount : "");
    if (!amountForCalc || isNaN(parseFloat(amountForCalc))) {
      setCommission(null);
      return;
    }
    api
      .get<CommissionCalculation>(`/commission/calculate?amount=${parseFloat(amountForCalc)}`)
      .then(setCommission)
      .catch(() => setCommission(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formAmount, milestones.length]);

  function resetForm() {
    setEditingId(null);
    setFormName("");
    setFormAmount("");
    setFormStart("");
    setFormEnd("");
    setFormError(null);
  }

  function startEdit(m: Milestone) {
    setEditingId(m.id);
    setFormName(m.name);
    setFormAmount(m.amount);
    setFormStart(m.startDate ? m.startDate.slice(0, 10) : "");
    setFormEnd(m.endDate ? m.endDate.slice(0, 10) : "");
    setFormError(null);
  }

  async function runAction(id: number, action: () => Promise<unknown>) {
    setActionBusyId(id);
    setActionError(null);
    try {
      await action();
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setActionError({ id, message: "Insufficient wallet balance to approve this milestone." });
      } else {
        setActionError({ id, message: err instanceof ApiError ? err.message : "Action failed." });
      }
    } finally {
      setActionBusyId(null);
    }
  }

  async function saveMilestone(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingId) {
        await api.patch(`/milestones/${editingId}`, {
          name: formName,
          amount: formAmount,
          startDate: formStart || undefined,
          endDate: formEnd || undefined,
        });
      } else {
        await api.post(`/contracts/${params.id}/milestones`, {
          name: formName,
          amount: formAmount,
          startDate: formStart || undefined,
          endDate: formEnd || undefined,
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save milestone.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="empty-state">
          <div className="icon">
            <i className="fa-solid fa-spinner fa-spin"></i>
          </div>
          Loading…
        </div>
      </DashboardShell>
    );
  }

  if (loadError || !contract) {
    return (
      <DashboardShell>
        <div className="empty-state">
          <div className="icon">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          {loadError || "Contract not found"}
        </div>
      </DashboardShell>
    );
  }

  const otherName = user?.role === "STUDENT" ? contract.guruName : contract.studentName;
  const totalValue = milestones.reduce((sum, m) => sum + parseFloat(m.amount), 0);

  function creatorName(m: Milestone) {
    if (!contract) return "";
    return m.createdById === contract.studentId ? contract.studentName : contract.guruName;
  }

  return (
    <DashboardShell>
      <div className="breadcrumb">
        <Link href="/contracts">Contracts</Link>
        <span className="sep">/</span>
        {otherName} — {contract.requirementTitle}
      </div>
      <div className="page-header flex-between">
        <div>
          <div className="eyebrow">Contract #CN-{contract.id}</div>
          <h1>
            {contract.requirementTitle} with {otherName}
          </h1>
          <p>
            Started {date(contract.createdAt)} · Milestone-based · Total value {money(totalValue)}
          </p>
        </div>
        <span style={{ alignSelf: "flex-start" }}>
          <StatusBadge status={contract.status} />
        </span>
      </div>

      <div className="grid grid-sidebar">
        <div className="stack">
          <div className="card flex-between">
            <div>
              <strong>Total contract value</strong>
              <div className="faint">{milestones.length} milestones</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={resetForm}>
              + Add milestone
            </button>
          </div>

          <div className="card">
            {milestones.length === 0 ? (
              <div className="empty-state">
                <div className="icon">
                  <i className="fa-solid fa-flag-checkered"></i>
                </div>
                No milestones yet.
              </div>
            ) : (
              milestones.map((m) => {
                const isCreator = user?.id === m.createdById;
                const rowError = actionError && actionError.id === m.id ? actionError.message : null;
                return (
                  <div className="milestone" key={m.id}>
                    <div className={dotClass(m.status)}></div>
                    <div>
                      <div className="flex-between">
                        <strong>{m.name}</strong>
                        <StatusBadge status={m.status} />
                      </div>
                      <p className="faint" style={{ margin: "4px 0 0" }}>
                        {date(m.startDate)} – {date(m.endDate)} · Created by {creatorName(m)}
                      </p>
                      {rowError && (
                        <p className="faint" style={{ margin: "6px 0 0", color: "var(--color-danger)" }}>
                          {rowError}
                          {rowError.includes("Insufficient") && (
                            <>
                              {" "}
                              <Link href="/wallet" style={{ fontWeight: 600 }}>
                                Go to wallet →
                              </Link>
                            </>
                          )}
                        </p>
                      )}
                      <div className="flex-gap" style={{ marginTop: 10 }}>
                        {m.status === "PENDING_APPROVAL" && !isCreator && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => startEdit(m)}>
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={actionBusyId === m.id}
                              onClick={() => runAction(m.id, () => api.post(`/milestones/${m.id}/reject`))}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {m.status === "PENDING_APPROVAL" && isCreator && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actionBusyId === m.id}
                            onClick={() => runAction(m.id, () => api.post(`/milestones/${m.id}/approve`))}
                          >
                            {actionBusyId === m.id ? "Approving…" : "Approve"}
                          </button>
                        )}
                        {m.status === "ACTIVE" && user?.role === "GURU" && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actionBusyId === m.id}
                            onClick={() => runAction(m.id, () => api.post(`/milestones/${m.id}/submit`))}
                          >
                            {actionBusyId === m.id ? "Submitting…" : "Mark complete"}
                          </button>
                        )}
                        {m.status === "SUBMITTED" && user?.role === "STUDENT" && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={actionBusyId === m.id}
                            onClick={() => runAction(m.id, () => api.post(`/milestones/${m.id}/release`))}
                          >
                            {actionBusyId === m.id ? "Releasing…" : "Approve & release"}
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong>{money(m.amount)}</strong>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="card">
            <h3>{editingId ? "Edit milestone" : "Add / edit milestone"}</h3>
            <form onSubmit={saveMilestone}>
              <div className="grid grid-2">
                <div className="field">
                  <label>Milestone name</label>
                  <input
                    type="text"
                    placeholder="e.g. API integration"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Amount (USD)</label>
                  <input
                    type="number"
                    placeholder="3000"
                    min={3000}
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Start date</label>
                  <input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
                </div>
                <div className="field">
                  <label>End date</label>
                  <input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
                </div>
              </div>
              <div className="hint" style={{ margin: "-6px 0 14px" }}>
                Minimum milestone amount is <strong>$3,000</strong> (configurable) — lower values are rejected on
                submit.
              </div>
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
              <div className="flex-gap" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Discard
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving…" : "Save milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            <h3>Payout breakdown</h3>
            <p className="faint">Shown to the guru for every milestone</p>
            <table>
              <tbody>
                <tr>
                  <td>Milestone amount</td>
                  <td style={{ textAlign: "right" }}>{commission ? money(commission.amount) : "—"}</td>
                </tr>
                <tr>
                  <td>Platform commission ({commission ? `${parseFloat(commission.ratePct)}%` : "—"})</td>
                  <td style={{ textAlign: "right", color: "var(--color-danger)" }}>
                    {commission ? `– ${money(commission.commission)}` : "—"}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>You receive</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <strong>{commission ? money(commission.net) : "—"}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            <Link href="/commission-calculator" style={{ display: "block", marginTop: 10, fontSize: 13, fontWeight: 600 }}>
              Open commission calculator →
            </Link>
          </div>
          <div className="card" style={{ background: "var(--color-warning-bg)", borderColor: "var(--color-warning-bg)" }}>
            <strong style={{ color: "var(--color-warning)" }}>Approval rule</strong>
            <p className="faint" style={{ marginTop: 6 }}>
              The milestone creator always gives the final approval — even if the other party has edited it first.
            </p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
