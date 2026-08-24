import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | string;
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = size === 'lg' ? 'w-14 h-14 text-2xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses} bg-gradient-to-tr from-blue-700 to-orange-500 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md`}>
        C
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold text-lg text-gray-900 tracking-tight leading-tight">Coordenação</span>
        <span className="text-xs text-gray-500 font-medium">Campanha Viva</span>
      </div>
    </div>
  );
}
