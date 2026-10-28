"use client";

import { useEffect, useState, useCallback, useRef, FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardShell, { initials } from "@/components/DashboardShell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ConversationSummary, Meeting, Message, Paginated } from "@/lib/types";
import { meetingWhen } from "@/lib/format";
import MeetingCard, { meetingPhase, useNow } from "@/components/MeetingCard";
import ScheduleMeetingModal from "@/components/ScheduleMeetingModal";
import "@/components/meetings.css";

function ChatContent() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [scheduling, setScheduling] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const now = useNow();

  const active = conversations.find((c) => String(c.id) === params.id);

  const loadConversations = useCallback(() => {
    api
      .get<ConversationSummary[]>("/conversations")
      .then(setConversations)
      .catch(() => {});
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.get<Paginated<Message>>(`/conversations/${params.id}/messages`);
      setMessages(res.items);
    } catch {
      // keep whatever we have
    }
  }, [params.id]);

  const loadMeetings = useCallback(() => {
    api
      .get<Meeting[]>(`/conversations/${params.id}/meetings`)
      .then(setUpcoming)
      .catch(() => {});
  }, [params.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
    setLoading(true);
    loadMessages().finally(() => setLoading(false));
  }, [loadMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
      loadMeetings();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadMessages, loadMeetings]);

  // Polling replaces `messages` every few seconds; only jump to the bottom
  // when a new message actually arrives, so reading history isn't interrupted.
  const lastMessageId = useRef<number | null>(null);
  useEffect(() => {
    const lastId = messages[messages.length - 1]?.id ?? null;
    if (lastId !== lastMessageId.current) {
      lastMessageId.current = lastId;
      bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
    }
  }, [messages]);

  function onScheduled({ message }: { meeting: Meeting; message: Message }) {
    setScheduling(false);
    setMeetingError(null);
    setMessages((prev) => [...prev, message]);
    loadMeetings();
    loadConversations();
  }

  async function onCancelMeeting(meeting: Meeting) {
    if (!window.confirm(`Cancel "${meeting.title}"? ${active?.otherUser.fullName ?? "The other participant"} will be notified.`)) return;
    setCancellingId(meeting.id);
    setMeetingError(null);
    try {
      const res = await api.post<{ meeting: Meeting; message: Message }>(`/meetings/${meeting.id}/cancel`);
      setMessages((prev) => [
        ...prev.map((m) => (m.meeting?.id === res.meeting.id ? { ...m, meeting: res.meeting } : m)),
        res.message,
      ]);
      loadMeetings();
      loadConversations();
    } catch (err) {
      setMeetingError(err instanceof ApiError ? err.message : "Couldn't cancel the meeting. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  const otherName = active?.otherUser.fullName ?? "the other participant";
  const nextMeeting = upcoming.find((m) => meetingPhase(m, now) !== "ended");

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const msg = await api.post<Message>(`/conversations/${params.id}/messages`, { body: draft });
      setMessages((prev) => [...prev, msg]);
      setDraft("");
    } catch {
      // ignore send failure, keep draft
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">In-app messaging</div>
        <h1>Messages</h1>
        <p>Chat with multiple trainers at once. Personal contact details (phone, email, Skype, Zoom) are automatically blocked.</p>
      </div>
      <div className="chat-shell">
      <div className="chat-list">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className={`chat-list-item${String(c.id) === params.id ? " active" : ""}`}
          >
            <div className="guru-photo" style={{ width: 42, height: 42 }}>
              {initials(c.otherUser.fullName)}
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex-between">
                <strong style={{ fontSize: 14 }}>{c.otherUser.fullName}</strong>
              </div>
              <p className="faint" style={{ margin: "2px 0 0", fontSize: 12.5 }}>
                {c.lastMessage ?? "No messages yet"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <div className="flex-gap">
            <div className="guru-photo" style={{ width: 38, height: 38 }}>
              {active ? initials(active.otherUser.fullName) : ""}
            </div>
            <div>
              <strong style={{ fontSize: 14 }}>{active?.otherUser.fullName ?? "Conversation"}</strong>
              <div className="faint" style={{ fontSize: 12 }}>
                {active?.otherUser.role === "GURU" ? "Guru" : "Student"}
              </div>
            </div>
          </div>
          <div className="flex-gap">
            <button
              type="button"
              className="icon-btn"
              title="Schedule a Google Meet"
              onClick={() => setScheduling(true)}
              disabled={!active}
            >
              <i className="fa-solid fa-video"></i>
            </button>
            <button className="btn btn-secondary btn-sm">Invite to contract</button>
          </div>
        </div>

        {nextMeeting && (
          <div className="meeting-strip">
            <div className="ms-text">
              <i className="fa-solid fa-video"></i>
              <span>
                <strong>{meetingPhase(nextMeeting, now) === "live" ? "Happening now" : "Next meeting"}:</strong>{" "}
                {nextMeeting.title} · {meetingWhen(nextMeeting.startTime, nextMeeting.endTime)}
                {upcoming.length > 1 ? ` · +${upcoming.length - 1} more` : ""}
              </span>
            </div>
            {nextMeeting.meetUrl && (
              <a className="btn btn-primary btn-sm" href={nextMeeting.meetUrl} target="_blank" rel="noopener noreferrer">
                Join
              </a>
            )}
          </div>
        )}
        {meetingError && (
          <div className="meeting-strip" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
            <div className="ms-text">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{meetingError}</span>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMeetingError(null)}>
              Dismiss
            </button>
          </div>
        )}

        <div className="chat-body" ref={bodyRef}>
          <div className="chat-system-note">
            <i className="fa-solid fa-lock"></i> Personal contact info is automatically hidden in this chat
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="icon">
                <i className="fa-solid fa-spinner fa-spin"></i>
              </div>
              Loading…
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="icon">
                <i className="fa-solid fa-comments"></i>
              </div>
              No messages yet. Say hello!
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === user?.id;
              if (m.type === "MEETING_SCHEDULED" && m.meeting) {
                return (
                  <MeetingCard
                    key={m.id}
                    meeting={m.meeting}
                    mine={mine}
                    otherName={otherName}
                    onCancel={onCancelMeeting}
                    cancelling={cancellingId === m.meeting.id}
                  />
                );
              }
              if (m.type === "MEETING_CANCELLED") {
                return (
                  <div key={m.id} className="chat-system-note">
                    <i className="fa-solid fa-calendar-xmark"></i> {mine ? "You" : otherName} cancelled the Google Meet
                    {m.meeting ? ` “${m.meeting.title}”` : ""}
                  </div>
                );
              }
              return (
                <div key={m.id} className={`bubble ${mine ? "bubble-out" : "bubble-in"}`}>
                  {m.body}
                </div>
              );
            })
          )}
        </div>

        <form className="chat-input" onSubmit={onSend}>
          <button type="button" className="icon-btn" title="Attach file">
            <i className="fa-solid fa-paperclip"></i>
          </button>
          <input
            type="text"
            placeholder="Type a message… (personal contact info will be filtered)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={sending}>
            Send
          </button>
        </form>
      </div>
      </div>
      {scheduling && (
        <ScheduleMeetingModal
          conversationId={params.id}
          otherName={otherName}
          onClose={() => setScheduling(false)}
          onScheduled={onScheduled}
        />
      )}
    </>
  );
}

export default function ChatPage() {
  return (
    <DashboardShell>
      <ChatContent />
    </DashboardShell>
  );
}
