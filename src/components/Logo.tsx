import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | string;
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = size === 'lg' ? 'w-24 h-24' : size === 'sm' ? 'w-10 h-10' : 'w-16 h-16';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses} flex items-center justify-center`}>
        <Image 
          src="/logo.png" 
          alt="Júnior Araújo Coordenação" 
          fill 
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </div>
  );
}
