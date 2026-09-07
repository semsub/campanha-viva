export const DEMAND_CATEGORIES = [
  { key: "saude",         label: "Saúde",              icon: "🏥", color: "#EF4444" },
  { key: "educacao",      label: "Educação",           icon: "🎓", color: "#3B82F6" },
  { key: "infraestrutura",label: "Infraestrutura",     icon: "🚧", color: "#F07A1A" },
  { key: "social",        label: "Assistência Social", icon: "🤝", color: "#8B5CF6" },
  { key: "seguranca",     label: "Segurança",          icon: "🛡️", color: "#1F2937" },
  { key: "transporte",    label: "Transporte",         icon: "🚌", color: "#0EA5E9" },
  { key: "habitacao",     label: "Habitação",          icon: "🏘️", color: "#A855F7" },
  { key: "trabalho",      label: "Trabalho e Renda",   icon: "💼", color: "#10B981" },
  { key: "meio_ambiente", label: "Meio Ambiente",      icon: "🌳", color: "#22C55E" },
  { key: "cultura",       label: "Cultura e Esporte",  icon: "🎭", color: "#EC4899" },
  { key: "juridico",      label: "Jurídico",           icon: "⚖️", color: "#6366F1" },
  { key: "documentacao",  label: "Documentação",       icon: "📄", color: "#64748B" },
  { key: "agua_esgoto",   label: "Água e Esgoto",      icon: "💧", color: "#0891B2" },
  { key: "iluminacao",    label: "Iluminação Pública", icon: "💡", color: "#EAB308" },
  { key: "limpeza",       label: "Limpeza Urbana",     icon: "🧹", color: "#84CC16" },
  { key: "outros",        label: "Outros",             icon: "📌", color: "#71717A" },
];

export const getCategory = (key: string) =>
  DEMAND_CATEGORIES.find((c) => c.key === key) ?? DEMAND_CATEGORIES[DEMAND_CATEGORIES.length - 1];
