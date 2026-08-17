import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Júnior Araújo Coordenação — Gestão Territorial",
  description:
    "Plataforma hierárquica de gestão territorial de campanha: Super Admin, Coordenadores, Lideranças e Eleitores.",
  icons: { icon: "/images/logo.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-[#00264D] antialiased">{children}</body>
    </html>
  );
}
