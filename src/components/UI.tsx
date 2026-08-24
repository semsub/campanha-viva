import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, children, actions }: { title: string, subtitle?: string, children?: React.ReactNode, actions?: React.ReactNode }) {
  const headerActions = actions || children;
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {headerActions && <div className="flex gap-2">{headerActions}</div>}
    </div>
  );
}

export function Badge({ children, color = 'blue' }: { children: React.ReactNode, color?: string }) {
  return <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${color}-100 text-${color}-800`}>{children}</span>;
}

export function EmptyState({ message, title, hint }: { message?: string, title?: string, hint?: string }) {
  const text = message || title || "Nenhum registro encontrado";
  return (
    <div className="text-center py-12 px-4 bg-gray-50 rounded-lg border border-dashed">
      <p className="text-gray-700 font-medium">{text}</p>
      {hint && <p className="text-sm text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', className = '', type = 'button' }: any) {
  const base = "px-4 py-2 rounded-md font-medium transition-colors";
  const variants: any = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  return <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
}

export function Field({ label, error, children }: { label: string, error?: string, children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ''}`}>{props.children}</select>;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ''}`} />;
}

export function Modal({ isOpen, open, onClose, title, children }: { isOpen?: boolean, open?: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  const visible = isOpen ?? open ?? false;
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl font-bold">&times;</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
