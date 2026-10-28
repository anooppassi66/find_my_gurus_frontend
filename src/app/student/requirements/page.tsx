"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { date, money } from "@/lib/format";
import { Requirement } from "@/lib/types";

export default function StudentRequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[] | null>(null);

  useEffect(() => {
    api
      .get<Requirement[]>("/requirements/mine")
      .then(setRequirements)
      .catch(() => setRequirements([]));
  }, []);

  return (
    <DashboardShell role="STUDENT">
      <div className="page-header flex-between">
        <div>
          <div className="eyebrow">Jobs</div>
          <h1>My Requirements</h1>
          <p>Everything you've posted, with proposal counts and current status.</p>
        </div>
        <Link href="/student/post-requirement" className="btn btn-primary">
          + Post Requirement
        </Link>
      </div>

      <div className="table-toolbar">
        <div className="filters">
          <select>
            <option>All statuses</option>
            <option>Open</option>
            <option>Matched</option>
            <option>In Contract</option>
            <option>Closed</option>
          </select>
          <select>
            <option>All categories</option>
            <option>Web Development</option>
            <option>Design</option>
            <option>Data &amp; AI</option>
          </select>
        </div>
        <input type="text" placeholder="Search requirements…" />
      </div>

      <div className="card card-flush">
        <div className="data-table-wrap">
          {requirements === null ? (
            <div className="empty-state">
              <div className="icon">
                <i className="fa-solid fa-spinner fa-spin"></i>
              </div>
              Loading…
            </div>
          ) : requirements.length === 0 ? (
            <div className="empty-state">
              <div className="icon">
                <i className="fa-solid fa-list-check"></i>
              </div>
              You haven't posted any requirements yet.
            </div>
          ) : (
            <table>
              <tbody>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Budget</th>
                  <th>Proposals</th>
                  <th>Posted</th>
                  <th>Status</th>
                  <th></th>
                </tr>
                {requirements.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/student/requirements/${r.id}`}>{r.title}</Link>
                    </td>
                    <td>{r.categoryName}</td>
                    <td>{money(r.budgetAmount)}</td>
                    <td>{r.proposalCount ?? 0}</td>
                    <td>{date(r.createdAt)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <Link href={`/student/requirements/${r.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="pagination">
        <span className="faint">
          Showing {requirements ? requirements.length : 0} of {requirements ? requirements.length : 0} requirements
        </span>
        <div className="pages">
          <button className="active">1</button>
        </div>
      </div>
    </DashboardShell>
  );
}
