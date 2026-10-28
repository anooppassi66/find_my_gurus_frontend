"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { Proposal } from "@/lib/types";
import { money, date } from "@/lib/format";

function ProposalsContent() {
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Proposal[]>("/proposals/mine")
      .then(setProposals)
      .catch(() => setProposals([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">Work · F-05</div>
        <h1>My proposals</h1>
        <p>Track every proposal you&apos;ve submitted and its current status.</p>
      </div>

      <div className="table-toolbar">
        <div className="filters">
          <select>
            <option>All statuses</option>
            <option>Pending</option>
            <option>Shortlisted</option>
            <option>Accepted</option>
            <option>Declined</option>
          </select>
          <input type="text" placeholder="Search by job title..." />
        </div>
        <span className="faint">{proposals?.length ?? 0} proposals</span>
      </div>

      <div className="card card-flush">
        {loading ? (
          <div className="empty-state">
            <div className="icon">
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
            Loading…
          </div>
        ) : !proposals || proposals.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <i className="fa-solid fa-paper-plane"></i>
            </div>
            You haven&apos;t submitted any proposals yet.
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table>
                <tbody>
                  <tr>
                    <th>Job title</th>
                    <th>Proposed amount</th>
                    <th>Date submitted</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                  {proposals.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/guru/jobs/${p.requirementId}`}>{p.requirementTitle ?? `Requirement #${p.requirementId}`}</Link>
                      </td>
                      <td>{money(p.proposedAmount)}</td>
                      <td>{date(p.createdAt)}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td>
                        <Link className="btn btn-secondary btn-sm" href={`/guru/jobs/${p.requirementId}`}>
                          View job
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination" style={{ padding: 16 }}>
              <span className="faint">
                Showing 1–{proposals.length} of {proposals.length} proposals
              </span>
              <div className="pages">
                <button className="active">1</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function GuruProposalsPage() {
  return (
    <DashboardShell role="GURU">
      <ProposalsContent />
    </DashboardShell>
  );
}
