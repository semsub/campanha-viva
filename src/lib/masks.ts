// (00) 00000-0000 (celular) ou (00) 0000-0000 (fixo). Formata em tempo real.
export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// 0000 0000 0000 (12 dígitos, 3 blocos de 4)
export function maskVoterTitle(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 12);
  if (d.length <= 4) return d;
  if (d.length <= 8) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}`;
}

// Zona (até 4 dígitos)
export function maskZone(v: string): string {
  return v.replace(/\D/g, "").slice(0, 4);
}

// Seção (até 4 dígitos)
export function maskSection(v: string): string {
  return v.replace(/\D/g, "").slice(0, 4);
}

// Data DD/MM/AAAA
// Só dígitos (utilitário)
export function maskDigits(v: string, max = 6): string {
  return v.replace(/\D/g, "").slice(0, max);
}

export function maskDate(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}
