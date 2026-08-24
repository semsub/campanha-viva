import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | string;
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = size === 'lg' ? 'w-12 h-12 text-2xl' : size === 'sm' ? 'w-6 h-6 text-sm' : 'w-8 h-8 text-base';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses} bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold`}>
        C
      </div>
      <span className="font-bold text-xl text-gray-900 tracking-tight">Coordenação</span>
    </div>
  );
}
