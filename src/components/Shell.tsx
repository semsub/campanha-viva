export function Shell({ user, children }: { user: any; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-lg text-gray-800">Painel Coordenador</h1>
        <div className="text-sm text-gray-600">
          {user.name || user.email} <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{user.role}</span>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
