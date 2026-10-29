"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";

const I = {
  home: "M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z",
  video: "M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM16 10l5-3v10l-5-3",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5",
  login: "M10 17l5-5-5-5M15 12H3M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5",
  dash: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
};

/** App-style bottom navigation. Only visible on phones (CSS), so the same site feels like an app there. */
export default function TabBar() {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const path = usePathname();

  const items = !user
    ? [{ href: "/", label: t("home"), icon: I.home }, { href: "/about", label: t("about"), icon: I.info }, { href: "/login", label: t("login"), icon: I.login }]
    : [
        { href: "/", label: t("home"), icon: I.home },
        profile?.role === "scout"
          ? { href: "/scout", label: t("scoutDashboard"), icon: I.dash }
          : { href: "/me", label: t("mySubmissions"), icon: I.video },
        { href: "/profile", label: t("profile"), icon: I.user },
        { href: "/about", label: t("about"), icon: I.info },
      ];

  return (
    <nav className="tabbar" aria-label="Main">
      {items.map((it) => {
        const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={active ? "active" : ""}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={it.icon} />
            </svg>
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
