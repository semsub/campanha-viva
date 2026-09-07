import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Júnior Araújo Coordenação",
  description: "Plataforma de gestão territorial de campanha",
  icons: { icon: "/favicon.png" },
};

export const viewport: Viewport = {
  themeColor: "#003B6F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-[#00264D] antialiased">{children}</body>
    </html>
  );
}
