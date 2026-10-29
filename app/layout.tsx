import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Splash from "@/components/Splash";
import TabBar from "@/components/TabBar";
import InstallPrompt from "@/components/InstallPrompt";
import SwRegister from "@/components/SwRegister";

export const metadata: Metadata = {
  title: "Rural Talent Scout",
  description: "Film a simple drill on your phone, get scored for your age group, and be seen by scouts.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Talent Scout", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#400849",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before first paint: skip the splash and intro if they were already shown in this session.
const earlyScript = `try{var d=document.documentElement,s=sessionStorage;if(s.getItem('splash')==='1')d.classList.add('splash-seen');if(s.getItem('intro')==='1')d.classList.add('intro-seen')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: earlyScript }} />
      </head>
      <body>
        <I18nProvider>
          <Splash />
          <Nav />
          <main>{children}</main>
          <Footer />
          <TabBar />
          <InstallPrompt />
          <SwRegister />
        </I18nProvider>
      </body>
    </html>
  );
}
