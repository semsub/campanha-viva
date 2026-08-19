// Máscaras aplicadas conforme o usuário digita.
// Recebem string livre e devolvem string formatada.

// (00) 00000-0000 — celular; para fixo (10 dígitos): (00) 0000-0000
export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// 0000 0000 0000 — título eleitoral (12 dígitos)
export function maskVoterTitle(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 12);
  if (d.length <= 4) return d;
  if (d.length <= 8) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}`;
}

// DD/MM/AAAA — data
export function maskDate(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

// Só dígitos (para zona/seção)
export function maskDigits(v: string, max = 6): string {
  return v.replace(/\D/g, "").slice(0, max);
}
