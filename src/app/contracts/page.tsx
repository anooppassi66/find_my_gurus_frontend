"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { date, money } from "@/lib/format";
import { Contract } from "@/lib/types";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get<Contract[]>("/contracts")
      .then(async (list) => {
        // GET /contracts doesn't include milestones; fetch details so we can show
        // real contract value / progress instead of the prototype's static numbers.
        const detailed = await Promise.all(
          list.map((c) => api.get<Contract>(`/contracts/${c.id}`).catch(() => c))
        );
        setContracts(detailed);
      })
      .catch(() => setContracts([]));
  }, [user]);

  const isGuru = user?.role === "GURU";

  return (
    <DashboardShell>
      {isGuru ? (
        <div className="page-header">
          <div className="eyebrow">Jobs module</div>
          <h1>My jobs</h1>
          <p>Contracts you've been awarded — active and completed.</p>
        </div>
      ) : (
        <div className="page-header">
          <div className="eyebrow">Contracts</div>
          <h1>Your contracts</h1>
          <p>Active and completed engagements with gurus you've hired.</p>
        </div>
      )}

      <div className="table-toolbar">
        <div className="filters">
          {isGuru ? (
            <select>
              <option>All</option>
              <option>Active</option>
              <option>Completed</option>
              <option>Ended early</option>
            </select>
          ) : (
            <select>
              <option>All statuses</option>
              <option>Active</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          )}
        </div>
        {isGuru ? (
          <span className="faint">{contracts ? contracts.length : 0} contracts</span>
        ) : (
          <input type="text" placeholder="Search contracts…" />
        )}
      </div>

      {contracts === null ? (
        <div className="empty-state">
          <div className="icon">
            <i className="fa-solid fa-spinner fa-spin"></i>
          </div>
          Loading…
        </div>
      ) : contracts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">
            <i className="fa-solid fa-file-signature"></i>
          </div>
          No contracts yet.
        </div>
      ) : isGuru ? (
        <div className="stack">
          {contracts.map((c) => (
            <div className="card" key={c.id}>
              <div className="flex-between">
                <div className="flex-gap">
                  <div className="guru-photo">{initialsOf(c.studentName)}</div>
                  <div>
                    <Link
                      href={`/contracts/${c.id}`}
                      style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}
                    >
                      {c.requirementTitle} — {c.studentName}
                    </Link>
                    <div className="faint">
                      Started {date(c.createdAt)} · Milestones{" "}
                      {(c.milestones ?? []).filter((m) => m.status === "RELEASED").length} of{" "}
                      {(c.milestones ?? []).length} complete
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <StatusBadge status={c.status} label={c.status === "ACTIVE" ? "Active" : undefined} />
                  <div style={{ marginTop: 6, fontWeight: 700 }}>
                    {money((c.milestones ?? []).reduce((sum, m) => sum + parseFloat(m.amount), 0))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-2">
          {contracts.map((c) => (
            <div className="card" key={c.id}>
              <div className="flex-between" style={{ marginBottom: 10 }}>
                <div className="flex-gap">
                  <div className="guru-photo">{initialsOf(c.guruName)}</div>
                  <div>
                    <strong>{c.guruName}</strong>
                    <div className="faint">{c.requirementTitle}</div>
                  </div>
                </div>
                <StatusBadge status={c.status} label={c.status === "ACTIVE" ? "Active" : undefined} />
              </div>
              <div className="grid grid-2" style={{ marginBottom: 12 }}>
                <div>
                  <div className="faint">Contract value</div>
                  <strong>
                    {money(
                      (c.milestones ?? []).reduce((sum, m) => sum + parseFloat(m.amount), 0)
                    )}
                  </strong>
                </div>
                <div>
                  <div className="faint">Progress</div>
                  <strong>
                    {(c.milestones ?? []).filter((m) => m.status === "RELEASED").length} of{" "}
                    {(c.milestones ?? []).length} milestones
                  </strong>
                </div>
              </div>
              <Link href={`/contracts/${c.id}`} className="btn btn-secondary btn-block">
                View contract
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
