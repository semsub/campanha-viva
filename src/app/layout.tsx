import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ScreenProtection } from "@/components/ScreenProtection";

export const metadata: Metadata = {
  title: "Júnior Araújo Coordenação",
  description: "Plataforma hierárquica de gestão territorial de campanha.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JA Coordenação",
  },
};

export const viewport: Viewport = {
  themeColor: "#003B6F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Sora:wght@300;400;600;700;800&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="JA Coordenação" />
      </head>
      <body className="bg-white text-[#00264D] antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ScreenProtection />
        {children}
      </body>
    </html>
  );
}
