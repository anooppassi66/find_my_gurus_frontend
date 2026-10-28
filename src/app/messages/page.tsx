"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell, { initials } from "@/components/DashboardShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ConversationSummary } from "@/lib/types";
import { date } from "@/lib/format";

function MessagesContent() {
  const { user } = useAuth();
  const isStudent = user?.role !== "GURU";
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ConversationSummary[]>("/conversations")
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  const body = loading ? (
    <div className="empty-state">
      <div className="icon">
        <i className="fa-solid fa-spinner fa-spin"></i>
      </div>
      Loading…
    </div>
  ) : !conversations || conversations.length === 0 ? (
    <div className="empty-state">
      <div className="icon">
        <i className="fa-solid fa-comments"></i>
      </div>
      No conversations yet.
    </div>
  ) : null;

  if (isStudent) {
    return (
      <>
        <div className="page-header flex-between">
          <div>
            <div className="eyebrow">In-app messaging</div>
            <h1>Messages</h1>
            <p>Chat with multiple trainers at once. Personal contact details are automatically blocked.</p>
          </div>
          <a href="#" className="btn btn-primary">
            + Invite Trainer
          </a>
        </div>

        <div className="table-toolbar">
          <div className="filters">
            <select>
              <option>All conversations</option>
              <option>Unread</option>
              <option>Active contracts</option>
              <option>Archived</option>
            </select>
          </div>
          <input type="text" placeholder="Search messages…" />
        </div>

        <div className="card card-flush">
          {body ?? (
            <div className="stack" style={{ gap: 0 }}>
              {conversations!.map((c, idx) => (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom: idx < conversations!.length - 1 ? "1px solid var(--color-border)" : undefined,
                    color: "inherit",
                  }}
                >
                  <div className="guru-photo" style={{ width: 48, height: 48 }}>
                    {initials(c.otherUser.fullName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex-between">
                      <strong>{c.otherUser.fullName}</strong>
                      <span className="faint" style={{ fontSize: 12 }}>
                        {c.lastMessageAt ? date(c.lastMessageAt) : ""}
                      </span>
                    </div>
                    <p
                      className="faint"
                      style={{ margin: "2px 0 0", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {c.lastMessage ?? "No messages yet"}
                    </p>
                    <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>
                      {c.otherUser.role === "GURU" ? "Guru" : "Student"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">Inbox</div>
        <h1>Messages</h1>
        <p>All your conversations with students. Personal contact details are automatically blocked in chat.</p>
      </div>

      <div className="card card-flush">
        {body ?? (
          <div className="chat-list" style={{ borderRight: "none" }}>
            {conversations!.map((c) => (
              <div className="chat-list-item" style={{ padding: "16px 20px" }} key={c.id}>
                <div className="guru-photo" style={{ width: 48, height: 48 }}>
                  {initials(c.otherUser.fullName)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex-between">
                    <strong style={{ fontSize: 15 }}>{c.otherUser.fullName}</strong>
                    <span className="faint" style={{ fontSize: 12 }}>
                      {c.lastMessageAt ? date(c.lastMessageAt) : ""}
                    </span>
                  </div>
                  <p className="faint" style={{ margin: "2px 0 4px", fontSize: 13 }}>
                    {c.lastMessage ?? "No messages yet"}
                  </p>
                  <div className="flex-gap">
                    <span className="faint" style={{ fontSize: 12 }}>
                      {c.otherUser.role === "STUDENT" ? "Student" : "Guru"}
                    </span>
                  </div>
                </div>
                <Link href={`/messages/${c.id}`} className="btn btn-secondary btn-sm" style={{ alignSelf: "center" }}>
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function MessagesPage() {
  return (
    <DashboardShell>
      <MessagesContent />
    </DashboardShell>
  );
}
