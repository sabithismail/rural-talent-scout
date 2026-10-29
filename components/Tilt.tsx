"use client";
import Link from "next/link";
import { PointerEvent, ReactNode, useRef } from "react";

/** A link that tilts in 3D toward the pointer or finger, with a soft light that follows it. */
export default function Tilt({
  href, className = "", children, max = 14,
}: { href: string; className?: string; children: ReactNode; max?: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const frame = useRef(0);

  const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function move(e: PointerEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el || reduced()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.classList.add("live");
      el.style.setProperty("--rx", `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      el.style.setProperty("--lift", "-8px");
    });
  }

  function leave() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.classList.remove("live");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--lift", "0px");
  }

  return (
    <Link
      ref={ref}
      href={href}
      className={className}
      onPointerMove={move}
      onPointerLeave={leave}
      onPointerCancel={leave}
      onPointerUp={(e) => { if (e.pointerType !== "mouse") leave(); }}
    >
      {children}
    </Link>
  );
}
