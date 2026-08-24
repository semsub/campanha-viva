import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface User {
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface SidebarProps {
  user?: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const links = [
    { href: '/dashboard', label: 'Início' },
    { href: '/dashboard/eleitores', label: 'Eleitores' },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 font-bold text-lg border-b border-gray-800 flex flex-col">
        <span>Menu</span>
        {user?.name && <span className="text-xs text-gray-400 font-normal mt-1">{user.name}</span>}
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <Link 
            key={link.href} 
            href={link.href}
            className={`block px-4 py-2 rounded-md transition ${pathname === link.href ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
