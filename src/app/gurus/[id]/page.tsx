"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PublicLayout from "@/components/PublicLayout";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { money, stars } from "@/lib/format";
import { GuruDetail } from "@/lib/types";

export default function GuruProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();

  const [guru, setGuru] = useState<GuruDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    setGuru(null);
    setNotFound(false);
    api
      .get<GuruDetail>(`/gurus/${userId}`)
      .then(setGuru)
      .catch(() => setNotFound(true));
  }, [userId]);

  async function onMessage() {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!guru) return;
    setMessaging(true);
    try {
      const res = await api.post<{ id: number }>("/conversations", { otherUserId: guru.userId });
      router.push(`/messages/${res.id}`);
    } catch {
      // ignore — stay on the profile
    } finally {
      setMessaging(false);
    }
  }

  if (notFound) {
    return (
      <PublicLayout footerStyle={{ marginTop: 48 }}>
        <div className="container" style={{ paddingTop: 28 }}>
          <div className="empty-state">
            <div className="icon">
              <i className="fa-solid fa-user-xmark"></i>
            </div>
            Guru not found.
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!guru) {
    return (
      <PublicLayout footerStyle={{ marginTop: 48 }}>
        <div className="container" style={{ paddingTop: 28 }}>
          <div className="empty-state">
            <div className="icon">
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout footerStyle={{ marginTop: 48 }}>
      <style>{`
        .profile-head { display: flex; gap: 20px; align-items: center; }
        .profile-photo { width: 96px; height: 96px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 30px; flex-shrink: 0; }
        .portfolio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .portfolio-thumb { aspect-ratio: 4/3; border-radius: var(--radius-md); background: var(--color-surface-alt); display: flex; align-items: center; justify-content: center; color: var(--color-text-faint); font-size: 12px; }
        .video-thumb { aspect-ratio: 16/9; border-radius: var(--radius-md); background: var(--color-secondary-light); display: flex; align-items: center; justify-content: center; color: var(--color-secondary-dark); font-size: 24px; }
        .review-item { padding: 16px 0; border-bottom: 1px solid var(--color-border); }
        .review-item:last-child { border-bottom: none; }
        .intro-video {
          aspect-ratio: 16/9; border-radius: var(--radius-md); overflow: hidden; position: relative;
          background: linear-gradient(135deg, var(--color-secondary-darker), var(--color-secondary));
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .intro-video .play-btn {
          width: 68px; height: 68px; border-radius: 50%; background: rgba(255,255,255,0.95);
          color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px;
          box-shadow: var(--shadow-lg);
        }
        .intro-video .caption {
          position: absolute; left: 16px; bottom: 14px; color: #fff; font-size: 13px; font-weight: 600;
          display: flex; align-items: center; gap: 8px;
        }
        .intro-video .caption .badge-live { background: rgba(0,0,0,0.35); padding: 3px 9px; border-radius: var(--radius-pill); font-size: 11px; }
        @media (max-width: 860px) { .portfolio-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <div className="container" style={{ paddingTop: 28 }}>
        <div className="breadcrumb">
          <Link href="/gurus">Find a Guru</Link>
          <span className="sep">/</span>
          {guru.categoryName && (
            <>
              <a href="#">{guru.categoryName}</a>
              <span className="sep">/</span>
            </>
          )}
          <span>{guru.fullName}</span>
        </div>

        <div className="grid grid-sidebar">
          <div className="stack">
            <div className="card">
              <div className="profile-head">
                <div className="profile-photo">
                  {guru.fullName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex-between">
                    <div>
                      <h1 style={{ marginBottom: 2 }}>{guru.fullName}</h1>
                      <p className="faint" style={{ margin: 0 }}>
                        {[guru.headline, [guru.city, guru.country].filter(Boolean).join(", ")]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="badge badge-success">Available</span>
                  </div>
                  <div className="stars" style={{ marginTop: 8 }}>
                    {stars(guru.ratingAvg).map((c, i) => (
                      <i key={i} className={`${c} fa-star`}></i>
                    ))}{" "}
                    <span className="faint">
                      {guru.ratingAvg ?? "—"} ({guru.ratingCount} reviews)
                    </span>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {guru.skills.map((s) => (
                      <span key={s} className="tag">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {guru.introVideoUrl && (
              <div className="card">
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <h3 style={{ marginBottom: 0 }}>Meet {guru.fullName.split(" ")[0]}</h3>
                  <span className="badge badge-info">
                    <i className="fa-solid fa-video"></i> Intro video
                  </span>
                </div>
                <div className="intro-video" onClick={() => window.open(guru.introVideoUrl!, "_blank")}>
                  <div className="play-btn">
                    <i className="fa-solid fa-play"></i>
                  </div>
                  <div className="caption">
                    {guru.fullName} — introduction <span className="badge-live">2:14</span>
                  </div>
                </div>
                <p className="faint" style={{ marginTop: 10, marginBottom: 0 }}>
                  A short video from {guru.fullName.split(" ")[0]} introducing themselves and their teaching style —
                  uploaded by the guru so students can get a feel for them before reaching out.
                </p>
              </div>
            )}

            <div className="card">
              <h3>About</h3>
              <p>{guru.bio || "This guru hasn't added a bio yet."}</p>
            </div>

            <div className="card">
              <h3>Portfolio</h3>
              <div className="empty-state" style={{ padding: "24px 12px" }}>
                <div className="icon">
                  <i className="fa-solid fa-images"></i>
                </div>
                {guru.fullName.split(" ")[0]} hasn&apos;t added portfolio items yet.
              </div>
            </div>

            <div className="card">
              <h3>Work sample videos</h3>
              <div className="empty-state" style={{ padding: "24px 12px" }}>
                <div className="icon">
                  <i className="fa-solid fa-video"></i>
                </div>
                No work sample videos yet.
              </div>
            </div>

            <div className="card">
              <div className="flex-between">
                <h3 style={{ marginBottom: 0 }}>Reviews ({guru.ratingCount})</h3>
              </div>
              <div className="empty-state" style={{ padding: "24px 12px" }}>
                <div className="icon">
                  <i className="fa-solid fa-star"></i>
                </div>
                Reviews from students will appear here.
              </div>
            </div>
          </div>

          <div className="stack">
            <div className="card">
              <h3>Contact / Hire {guru.fullName.split(" ")[0]}</h3>
              <p className="faint">
                {guru.hourlyRate ? `From ${money(guru.hourlyRate)}/hr · ` : ""}Responds in ~2 hours
              </p>
              <button className="btn btn-primary btn-block" onClick={onMessage} disabled={messaging}>
                Message {guru.fullName.split(" ")[0]}
              </button>
              <Link href="/student/post-requirement" className="btn btn-secondary btn-block" style={{ marginTop: 8 }}>
                Invite to a Requirement
              </Link>
              <div className="divider"></div>
              <div className="flex-between">
                <span className="faint">Contracts completed</span>
                <strong>—</strong>
              </div>
              <div className="flex-between" style={{ marginTop: 6 }}>
                <span className="faint">On-time delivery</span>
                <strong>—</strong>
              </div>
              <div className="flex-between" style={{ marginTop: 6 }}>
                <span className="faint">Response time</span>
                <strong>~2 hrs</strong>
              </div>
            </div>
            <div className="card">
              <h3>Languages</h3>
              <p className="faint">—</p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
