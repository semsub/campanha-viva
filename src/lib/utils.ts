export function generateProtocol(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `DEM-${year}${month}${day}-${random}`;
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR");
}

export const statusLabels: Record<string, string> = {
  aberta: "Aberta",
  em_analise: "Em Análise",
  aguardando_informacao: "Aguardando Informação",
  encaminhada: "Encaminhada",
  em_atendimento: "Em Atendimento",
  aguardando_terceiro: "Aguardando Terceiro",
  resolvida: "Resolvida",
  cancelada: "Cancelada",
  encerrada: "Encerrada",
};

export const priorityLabels: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  coordenador_geral: "Coordenador Geral",
  coordenador_regional: "Coordenador Regional",
  coordenador_municipal: "Coordenador Municipal",
  lideranca: "Liderança",
  mobilizador: "Mobilizador",
  atendente: "Atendente",
  auditor: "Auditor",
  visualizador: "Visualizador",
};

export const statusColors: Record<string, string> = {
  aberta: "bg-blue-100 text-blue-800",
  em_analise: "bg-yellow-100 text-yellow-800",
  aguardando_informacao: "bg-orange-100 text-orange-800",
  encaminhada: "bg-purple-100 text-purple-800",
  em_atendimento: "bg-indigo-100 text-indigo-800",
  aguardando_terceiro: "bg-gray-100 text-gray-800",
  resolvida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
  encerrada: "bg-slate-100 text-slate-800",
};

export const priorityColors: Record<string, string> = {
  baixa: "bg-green-100 text-green-800",
  media: "bg-yellow-100 text-yellow-800",
  alta: "bg-orange-100 text-orange-800",
  urgente: "bg-red-100 text-red-800",
};
