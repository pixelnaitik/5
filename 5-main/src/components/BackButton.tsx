import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ className = '', onClick }: { className?: string, onClick?: () => void }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={onClick || (() => navigate(-1))}
      className={`absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary rounded-xl shadow-sm border border-outline-variant/30 transition-all ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-bold">Back</span>
    </button>
  );
}
