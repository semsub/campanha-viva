import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Download, 
  MousePointer2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const DATA = [
  { name: 'Seg', uploads: 400, downloads: 240 },
  { name: 'Ter', uploads: 300, downloads: 139 },
  { name: 'Qua', uploads: 200, downloads: 980 },
  { name: 'Qui', uploads: 278, downloads: 390 },
  { name: 'Sex', uploads: 189, downloads: 480 },
  { name: 'Sáb', uploads: 239, downloads: 380 },
  { name: 'Dom', uploads: 349, downloads: 430 },
];

const STATS = [
  { label: 'Total de Uploads', value: '12,482', change: '+12%', trend: 'up', icon: Users },
  { label: 'Downloads HD', value: '8,921', change: '+18%', trend: 'up', icon: Download },
  { label: 'Engajamento', value: '94.2%', change: '-2%', trend: 'down', icon: TrendingUp },
  { label: 'Cliques Únicos', value: '45.2k', change: '+24%', trend: 'up', icon: MousePointer2 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h3 className="text-4xl font-black uppercase tracking-tighter font-serif">Painel <span className="text-brand-gold">Analítico</span></h3>
        <p className="text-slate-400">Monitore o desempenho das suas campanhas em tempo real.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {STATS.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-black uppercase tracking-widest",
                stat.trend === 'up' ? "text-emerald-500" : "text-red-500"
              )}>
                {stat.change}
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
              <h4 className="text-3xl font-black tracking-tighter mt-1">{stat.value}</h4>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl space-y-6">
          <h5 className="text-lg font-black uppercase tracking-tight">Crescimento de Uploads</h5>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000080" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#000080" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#D4AF37' }}
                />
                <Area type="monotone" dataKey="uploads" stroke="#000080" strokeWidth={3} fillOpacity={1} fill="url(#colorUploads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl space-y-6">
          <h5 className="text-lg font-black uppercase tracking-tight">Downloads vs Conversão</h5>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="downloads" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
