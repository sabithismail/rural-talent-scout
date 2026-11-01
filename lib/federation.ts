export type Federation = {
  id: number;
  state: string;
  keys: string[];
  body_name: string;
  email: string;
  kind: string;
  confidence: "official" | "closest";
  source_url: string | null;
  note: string | null;
};

export type Facts = {
  name: string;
  age: number | null;
  village: string | null;
  district: string | null;
  state: string | null;
  sport: string;
  score: number;
  date: string;
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "Tamil Nadu", "tamilnadu" and "TAMIL-NADU" all become "tamilnadu". */
export const normState = (s?: string | null) =>
  (s ?? "").toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");

export function matchFederation(list: Federation[], state?: string | null): Federation | null {
  const k = normState(state);
  if (!k) return null;
  return list.find((f) => f.keys.includes(k)) ?? null;
}

const day = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

/** Plain, honest email built only from the player's own verified details. Used when the AI is off or fails. */
export function templateDraft(f: Facts, link: string): { subject: string; body: string } {
  const where = [f.village, f.district, f.state].filter(Boolean).join(", ");
  const minor = f.age == null || f.age < 18;
  const lines = [
    "Respected Sir/Madam,",
    "",
    `My name is ${f.name}${f.age ? `, aged ${f.age}` : ""}${where ? `, from ${where}` : ""}. I play ${f.sport}.`,
    "",
    `I recorded a drill video on Rural Talent Scout, a student project that checks the video and gives a 0 to 100 score from the measured result. My score is ${f.score}/100${day(f.date) ? ` (recorded on ${day(f.date)})` : ""}.`,
    "",
    `You can confirm this score here: ${link}`,
    "",
    `I would be grateful for the chance to attend a district or state trial, and to know about any selection camps or programmes for ${f.sport}.`,
    ...(minor ? ["", "My parent or guardian knows that I am writing this email."] : []),
    "",
    "Thank you for your time.",
    "",
    f.name,
  ];
  return {
    subject: `Talent referral: ${f.name}, ${f.sport}, score ${f.score}/100${f.district ? ` (${f.district})` : ""}`,
    body: lines.join("\n"),
  };
}

export const mailtoUrl = (to: string, subject: string, body: string) =>
  `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const gmailUrl = (to: string, subject: string, body: string) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
