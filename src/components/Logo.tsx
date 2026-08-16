import Image from "next/image";

interface LogoProps {
  variant?: "full" | "icon" | "text";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ variant = "full", className = "", size = "md" }: LogoProps) {
  const sizes = {
    sm: { width: 32, height: 32, text: "text-sm" },
    md: { width: 48, height: 48, text: "text-base" },
    lg: { width: 64, height: 64, text: "text-lg" },
    xl: { width: 96, height: 96, text: "text-xl" },
  };

  const currentSize = sizes[size];

  if (variant === "icon") {
    return (
      <div className={`relative ${className}`} style={{ width: currentSize.width, height: currentSize.height }}>
        <Image src="/images/logo.png" alt="Júnior Araújo Coordenação" fill className="object-contain" priority />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="font-black text-brand-blue" style={{ fontFamily: "'Playfair Display', serif" }}>JÚNIOR ARAÚJO</span>
        <span className="font-bold text-brand-orange text-xs tracking-widest uppercase">COORDENAÇÃO</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: currentSize.width, height: currentSize.height }}>
        <Image src="/images/logo.png" alt="Júnior Araújo Coordenação" fill className="object-contain" priority />
      </div>
    </div>
  );
}
