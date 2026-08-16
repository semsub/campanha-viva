"use client";

import { useEffect, useState } from "react";

interface TItem { id: number; name?: string; number?: string; state?: string; }

export default function TerritorialPage() {
  const [municipalities, setMunicipalities] = useState<TItem[]>([]);
  const [regions, setRegions] = useState<TItem[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<TItem[]>([]);
  const [zones, setZones] = useState<TItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("municipalities");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [m, r, n, z] = await Promise.all([
        fetch("/api/territorial?type=municipalities").then(r => r.json()),
        fetch("/api/territorial?type=regions").then(r => r.json()),
        fetch("/api/territorial?type=neighborhoods").then(r => r.json()),
        fetch("/api/territorial?type=zones").then(r => r.json()),
      ]);
      setMunicipalities(m.data); setRegions(r.data); setNeighborhoods(n.data); setZones(z.data); setLoading(false);
    };
    load();
  }, []);

  const tabs = [
    { key: "municipalities", label: "Municípios", icon: "🏙️", count: municipalities.length },
    { key: "regions", label: "Regiões", icon: "📍", count: regions.length },
    { key: "neighborhoods", label: "Bairros", icon: "🏘️", count: neighborhoods.length },
    { key: "zones", label: "Zonas Eleitorais", icon: "🗳️", count: zones.length },
  ];

  const getItems = () => {
    switch (activeTab) {
      case "municipalities": return municipalities.map(m => ({ id: m.id, label: m.name || "", sub: m.state || "" }));
      case "regions": return regions.map(r => ({ id: r.id, label: r.name || "", sub: "" }));
      case "neighborhoods": return neighborhoods.map(n => ({ id: n.id, label: n.name || "", sub: "" }));
      case "zones": return zones.map(z => ({ id: z.id, label: `Zona ${z.number}`, sub: "" }));
      default: return [];
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-brand-blue" style={{ fontFamily: "'Playfair Display', serif" }}>Estrutura Territorial</h1><p className="text-sm text-gray-400">Hierarquia territorial da campanha</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`stat-card text-left transition-all cursor-pointer ${activeTab === tab.key ? "border-brand-orange border-2 shadow-xl shadow-brand-orange/10" : "border border-gray-100"}`}>
            <span className="text-2xl">{tab.icon}</span>
            <p className="text-2xl font-extrabold text-brand-blue mt-2">{tab.count}</p>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{tab.label}</p>
          </button>
        ))}
      </div>
      <div className="card">
        <h3 className="text-base font-bold text-brand-blue mb-4 flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-brand-orange inline-block" /> {tabs.find(t => t.key === activeTab)?.label}</h3>
        {loading ? <div className="text-center text-gray-300 py-8">Carregando...</div>
        : <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {getItems().map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-brand-gray rounded-xl hover:bg-brand-cream/50 transition-colors">
              <span className="text-lg">{tabs.find(t => t.key === activeTab)?.icon}</span>
              <div><p className="font-semibold text-sm text-brand-blue">{item.label}</p>{item.sub && <p className="text-xs text-gray-400">{item.sub}</p>}</div>
            </div>
          ))}
          {getItems().length === 0 && <div className="col-span-full text-center text-gray-300 py-4">Nenhum registro</div>}
        </div>}
      </div>
    </div>
  );
}
