"use client";
import { LOGO_DATA_URI } from "@/lib/logo-data";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: 70, md: 140, lg: 240 };
  const w = dims[size];

  return (
    <div className="flex flex-col items-center select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_DATA_URI}
        alt="Júnior Araújo Coordenação"
        width={w}
        height={w}
        style={{ width: w, height: "auto" }}
        draggable={false}
      />
    </div>
  );
}
