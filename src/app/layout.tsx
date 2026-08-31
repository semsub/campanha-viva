import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Júnior Araújo Coordenação",
  description: "Plataforma de gestão territorial de campanha — campanhaviva.com.br",
  manifest: "/manifest.json",
  applicationName: "Júnior Araújo Coordenação",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JA Coordenação",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#003B6F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* iOS específico */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JA Coordenação" />
        {/* Windows / edge */}
        <meta name="msapplication-TileColor" content="#003B6F" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
      </head>
      <body className="bg-white text-[#00264D] antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
