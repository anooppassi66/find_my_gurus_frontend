const MAP: Record<string, [string, string]> = {
  OPEN: ["badge-info", "Open"],
  MATCHED: ["badge-info", "Matched"],
  IN_CONTRACT: ["badge-success", "In contract"],
  CLOSED: ["badge-neutral", "Closed"],
  CANCELLED: ["badge-danger", "Cancelled"],
  PENDING: ["badge-warning", "Pending"],
  SHORTLISTED: ["badge-info", "Shortlisted"],
  ACCEPTED: ["badge-success", "Accepted"],
  DECLINED: ["badge-danger", "Declined"],
  ACTIVE: ["badge-info", "In progress"],
  COMPLETED: ["badge-success", "Completed"],
  DISPUTED: ["badge-danger", "Disputed"],
  PENDING_APPROVAL: ["badge-warning", "Awaiting approval"],
  SUBMITTED: ["badge-warning", "Submitted for release"],
  RELEASED: ["badge-success", "Approved & Paid"],
  REJECTED: ["badge-danger", "Rejected"],
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const [cls, text] = MAP[status] ?? ["badge-neutral", status.replace(/_/g, " ").toLowerCase()];
  return <span className={`badge ${cls}`}>{label ?? text}</span>;
}
