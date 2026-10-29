"use client";
import type { ReactNode } from "react";
import { TEAM } from "@/lib/team";
import { useI18n } from "@/lib/i18n";
import { ABOUT } from "@/lib/about-text";

/** Turns `text` in backticks into <code> elements. Everything else stays plain text (no HTML injection). */
function rich(s: string): ReactNode[] {
  return s.split("`").map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}

export default function AboutView() {
  const { lang } = useI18n();
  const a = ABOUT[lang];
  return (
    <div className="about">
      <h1>{a.title}</h1>
      <p className="muted">{a.intro}</p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{a.whatH}</h2>
        <p>{a.whatP}</p>
        <h2>{a.whyH}</h2>
        <p>{a.whyP}</p>
      </div>

      <div className="card">
        <h2 id="docs" style={{ marginTop: 0 }}>{a.howH}</h2>
        <h3>{a.playerH}</h3>
        <ol>{a.playerSteps.map(([b, t]) => <li key={b}><strong>{b}</strong> {t}</li>)}</ol>
        <h3>{a.scoutH}</h3>
        <ol>{a.scoutSteps.map((t) => <li key={t}>{t}</li>)}</ol>
      </div>

      <div className="card">
        <h2 id="architecture" style={{ marginTop: 0 }}>{a.archH}</h2>
        <ul>{a.arch.map(([b, t]) => <li key={b}><strong>{b}</strong> {t}</li>)}</ul>
        <h2>{a.scoreH}</h2>
        <p>{a.scoreP1}</p>
        <pre className="code">{`score = clamp( (value - floor) / (elite - floor), 0, 1 ) x 100`}</pre>
        <p>{a.scoreP2}</p>
        <p className="muted">{a.scoreNote}</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{a.javaH}</h2>
        <p>{rich(a.javaP)}</p>
        <pre className="code">{`POST /api/score
{ "sport": "sprint", "age": 16, "gender": "male", "value": 7.0 }

200 OK
{ "score": 52.2, "ageBand": "U16", "band": "DEVELOPING",
  "floor": 8.2, "elite": 5.9, ... }`}</pre>
        <h3>{a.conceptsH}</h3>
        <ul>{a.concepts.map(([b, t]) => <li key={b}><strong>{b}</strong> {rich(t)}</li>)}</ul>
      </div>

      <h2>{a.teamH}</h2>
      <div className="team">
        {TEAM.map((m) => (
          <div className="member" key={m.name}>
            <h3>{m.name}</h3>
            <div className="muted">{m.role}</div>
            <div className="links">
              {m.instagram && <a href={`https://instagram.com/${m.instagram}`} target="_blank" rel="noopener noreferrer">Instagram</a>}
              {m.linkedin && <a href={`https://www.linkedin.com/in/${m.linkedin}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
              {m.github && <a href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer">GitHub</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
