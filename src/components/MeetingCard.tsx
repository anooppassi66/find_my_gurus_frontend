"use client";

import { useEffect, useState } from "react";
import { Meeting } from "@/lib/types";
import { meetingWhen } from "@/lib/format";

const EARLY_JOIN_MS = 10 * 60 * 1000;

export function meetingPhase(m: Meeting, now = Date.now()) {
  if (m.status === "CANCELLED") return "cancelled" as const;
  const start = new Date(m.startTime).getTime();
  const end = new Date(m.endTime).getTime();
  if (now > end) return "ended" as const;
  if (now >= start - EARLY_JOIN_MS) return "live" as const;
  return "upcoming" as const;
}

const BADGE = {
  upcoming: ["badge-info", "Scheduled"],
  live: ["badge-success", "Happening now"],
  ended: ["badge-neutral", "Ended"],
  cancelled: ["badge-danger", "Cancelled"],
} as const;

export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export default function MeetingCard({
  meeting,
  mine,
  otherName,
  onCancel,
  cancelling,
}: {
  meeting: Meeting;
  mine: boolean;
  otherName: string;
  onCancel: (m: Meeting) => void;
  cancelling: boolean;
}) {
  const now = useNow();
  const phase = meetingPhase(meeting, now);
  const [badgeClass, badgeText] = BADGE[phase];
  const active = phase === "upcoming" || phase === "live";

  return (
    <div className={`meeting-card ${mine ? "out" : "in"}${phase === "cancelled" ? " cancelled" : ""}`}>
      <div className="mc-head">
        <div className="mc-icon">
          <i className="fa-solid fa-video"></i>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex-between" style={{ gap: 8 }}>
            <span className="mc-eyebrow">Google Meet</span>
            <span className={`badge ${badgeClass}`}>{badgeText}</span>
          </div>
          <div className="mc-title">{meeting.title}</div>
        </div>
      </div>

      <div className="mc-when">
        <i className="fa-regular fa-calendar"></i>
        <span>
          {meetingWhen(meeting.startTime, meeting.endTime)} · {meeting.durationMinutes} min
        </span>
      </div>
      {meeting.description && <p className="mc-notes">{meeting.description}</p>}

      {active && (
        <div className="mc-actions">
          {meeting.meetUrl && (
            <a className="btn btn-primary btn-sm" href={meeting.meetUrl} target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-video"></i> Join Google Meet
            </a>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => onCancel(meeting)} disabled={cancelling}>
            {cancelling ? "Cancelling…" : "Cancel"}
          </button>
        </div>
      )}

      <div className="mc-foot">
        {mine ? `You scheduled this · ${otherName} was notified by email` : `Scheduled by ${otherName} · invite emailed to you`}
      </div>
    </div>
  );
}
