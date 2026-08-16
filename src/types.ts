import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  frameUrl: string;
  author: string;
  category: string;
  stats: {
    views: number;
    uses: number;
  };
  price?: number;
  isFree?: boolean;
  createdAt?: any;
  // Political fields
  party?: string;
  number?: string;
  slogan?: string;
  status?: 'Pré-Candidato' | 'Candidato';
  office?: string;
  showParty?: boolean;
  showNumber?: boolean;
  hashtag?: string;
}
