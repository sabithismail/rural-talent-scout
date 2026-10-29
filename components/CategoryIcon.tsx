/** Simple line icons, one per sport category. */
export default function CategoryIcon({ category, size = 38 }: { category: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (category) {
    case "Team Sports": // ball
      return (<svg {...common}><circle cx="24" cy="24" r="16" /><path d="M24 8v8M24 32v8M9 20l7 3M32 25l7 3M12 36l6-5M30 17l6-5" /></svg>);
    case "Racquet Sports": // racquet
      return (<svg {...common}><ellipse cx="28" cy="19" rx="12" ry="14" transform="rotate(35 28 19)" /><path d="M20 28L9 41" /><path d="M22 14l12 10M26 10l12 10" strokeWidth="2" /></svg>);
    case "Combat & Strength": // dumbbell
      return (<svg {...common}><path d="M14 24h20" /><rect x="7" y="16" width="7" height="16" rx="2" /><rect x="34" y="16" width="7" height="16" rx="2" /><path d="M4 21v6M44 21v6" /></svg>);
    case "Skill & Endurance": // target
      return (<svg {...common}><circle cx="24" cy="24" r="17" /><circle cx="24" cy="24" r="10" /><circle cx="24" cy="24" r="3" fill="currentColor" /></svg>);
    default: // Athletics: track
      return (<svg {...common}><rect x="6" y="12" width="36" height="24" rx="12" /><rect x="14" y="19" width="20" height="10" rx="5" /></svg>);
  }
}
