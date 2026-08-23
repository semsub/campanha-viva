"use client";
import { useCallback } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  mask: "phone" | "titulo" | "date";
  placeholder?: string;
  className?: string;
  required?: boolean;
};

function applyMask(raw: string, mask: "phone" | "titulo" | "date"): string {
  const d = raw.replace(/\D/g, "");
  if (mask === "phone") {
    // (00) 00000-0000
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }
  if (mask === "titulo") {
    // 0000 0000 0000
    if (d.length <= 4) return d;
    if (d.length <= 8) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8, 12)}`;
  }
  if (mask === "date") {
    // DD/MM/AAAA
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
  }
  return raw;
}

export function MaskedInput({ value, onChange, mask, placeholder, className, required }: Props) {
  const handle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, mask);
    onChange(masked);
  }, [mask, onChange]);

  const maxLen = mask === "phone" ? 15 : mask === "titulo" ? 14 : 10;

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handle}
      placeholder={placeholder}
      maxLength={maxLen}
      required={required}
      className={className}
    />
  );
}
