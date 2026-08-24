import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | string;
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = size === 'lg' ? 'w-16 h-16 text-3xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-xl';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses} bg-gradient-to-tr from-blue-700 to-orange-500 rounded-2xl flex items-center justify-center text-white font-black shadow-lg border border-white/20`}>
        C
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold text-xl text-gray-900 tracking-tight leading-tight">Coordenação</span>
        <span className="text-xs text-orange-600 font-semibold tracking-wide uppercase">Campanha Viva</span>
      </div>
    </div>
  );
}
