import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading records...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
