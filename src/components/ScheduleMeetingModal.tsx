"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Meeting, Message } from "@/lib/types";

const DURATIONS = [15, 30, 45, 60, 90, 120];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Next whole hour, at least 30 minutes from now.
function defaultStart() {
  const d = new Date(Date.now() + 30 * 60000);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ScheduleMeetingModal({
  conversationId,
  otherName,
  onClose,
  onScheduled,
}: {
  conversationId: string;
  otherName: string;
  onClose: () => void;
  onScheduled: (result: { meeting: Meeting; message: Message }) => void;
}) {
  const initial = defaultStart();
  const [title, setTitle] = useState(`Session with ${otherName}`);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const start = new Date(`${date}T${time}`);
    if (isNaN(start.getTime())) {
      setError("Pick a valid date and time.");
      return;
    }
    if (start.getTime() < Date.now()) {
      setError("Pick a time in the future.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.post<{ meeting: Meeting; message: Message }>(
        `/conversations/${conversationId}/meetings`,
        {
          title,
          description: notes.trim() || undefined,
          startTime: start.toISOString(),
          durationMinutes: duration,
          timeZone,
        }
      );
      onScheduled(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't schedule the meeting. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <form className="card modal-card" onSubmit={onSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="flex-between" style={{ marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>
            <i className="fa-solid fa-video"></i> Schedule a Google Meet
          </h3>
          <button type="button" className="icon-btn" title="Close" onClick={onClose} disabled={submitting}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <p className="faint" style={{ margin: "0 0 18px" }}>
          A Google Meet link is created automatically. {otherName} will be notified in this chat and by email.
        </p>

        <div className="field">
          <label>Title</label>
          <input type="text" value={title} maxLength={120} required onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} min={todayString()} required onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Start time</label>
            <input type="time" value={time} required onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Duration</label>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d < 60 ? `${d} minutes` : d === 60 ? "1 hour" : `${d / 60} hours`}
              </option>
            ))}
          </select>
          <div className="hint">Times are in your time zone ({timeZone}).</div>
        </div>

        <div className="field">
          <label>Agenda / notes (optional)</label>
          <textarea
            value={notes}
            maxLength={1000}
            placeholder="What would you like to cover?"
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="hint">Personal contact details are removed automatically.</div>
        </div>

        {error && (
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
            {error}
          </div>
        )}

        <div className="flex-gap" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating meeting…" : "Create Google Meet"}
          </button>
        </div>
      </form>
    </div>
  );
}
