import React from 'react';
import { Database, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DbStatusBanner({ dbStatus }) {
  if (!dbStatus) return null;

  const isFallback = dbStatus.is_fallback;
  const engine = dbStatus.engine || 'Oracle 11g';
  const driver = dbStatus.driver_name || 'Oracle ODBC (pyodbc)';

  if (isFallback) {
    return (
      <div className="bg-amber-950/40 border border-amber-600/40 text-amber-300 px-4 py-2.5 rounded-xl mb-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-semibold text-amber-200">DEVELOPMENT FALLBACK ACTIVE: </span>
            <span>Oracle 11g ODBC connection not detected. Operating on SQLite Dev Engine. All CRUD and SQL operations remain fully functional.</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs bg-amber-900/60 text-amber-200 px-2.5 py-1 rounded-md border border-amber-700/50">
          <Database className="w-3.5 h-3.5" />
          <span>Driver: {driver}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 px-4 py-2.5 rounded-xl mb-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 text-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <span className="font-semibold text-emerald-200">LIVE DATABASE CONNECTED: </span>
          <span>Oracle Database 11g Release 2 connected via {driver}.</span>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-xs bg-emerald-900/60 text-emerald-200 px-2.5 py-1 rounded-md border border-emerald-700/50">
        <Database className="w-3.5 h-3.5" />
        <span>{engine}</span>
      </div>
    </div>
  );
}
