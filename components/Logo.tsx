/** Brand mark: a sapling inside a ring, the ring is the track, the sapling is the player.
 *  `animate` draws the ring and stem, then pops the leaves (used by the splash screen). */
export default function Logo({ size = 120, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg
      className={`logo ${animate ? "logo-animate" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Rural Talent Scout logo"
    >
      <circle className="l-ring" cx="60" cy="60" r="52" pathLength={1} fill="none" stroke="#E7B0DE" strokeWidth="6" strokeLinecap="round" />
      <path className="l-ground" d="M30 94 Q60 82 90 94" pathLength={1} fill="none" stroke="#E7B0DE" strokeWidth="5" strokeLinecap="round" />
      <path className="l-stem" d="M60 90 V54" pathLength={1} fill="none" stroke="#400849" strokeWidth="6" strokeLinecap="round" />
      <path className="l-leaf l-leaf-left" d="M60 68 C42 68 32 56 32 42 C48 42 60 52 60 68 Z" fill="#400849" />
      <path className="l-leaf l-leaf-right" d="M60 56 C60 40 72 30 90 30 C90 48 78 58 60 56 Z" fill="#E7B0DE" />
    </svg>
  );
}
