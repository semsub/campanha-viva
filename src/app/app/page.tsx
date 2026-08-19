import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { voters, demands, tasks, events, users } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Estatísticas rápidas do dashboard
  const [votersCount] = await db.select({ count: count() }).from(voters);
  const [demandsCount] = await db.select({ count: count() }).from(demands);
  const [openDemandsCount] = await db.select({ count: count() }).from(demands).where(eq(demands.status, "aberta"));
  const [tasksCount] = await db.select({ count: count() }).from(tasks);
  const [eventsCount] = await db.select({ count: count() }).from(events);
  const [usersCount] = await db.select({ count: count() }).from(users);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#00264D]">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral da campanha</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Eleitores</p>
            <h3 className="text-2xl font-bold text-[#00264D] mt-1">{votersCount?.count || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xl">👥</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Demandas</p>
            <h3 className="text-2xl font-bold text-[#00264D] mt-1">{demandsCount?.count || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl">📋</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Demandas Abertas</p>
            <h3 className="text-2xl font-bold text-[#00264D] mt-1">{openDemandsCount?.count || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-xl">⏳</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Tarefas Pendentes</p>
            <h3 className="text-2xl font-bold text-[#00264D] mt-1">{tasksCount?.count || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xl">✅</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Eventos</p>
            <h3 className="text-2xl font-bold text-[#00264D] mt-1">{eventsCount?.count || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-xl">📅</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Usuários</p>
            <h3 className="text-2xl font-bold text-[#00264D] mt-1">{usersCount?.count || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center text-xl">👤</div>
        </div>
      </div>
    </div>
  );
}
