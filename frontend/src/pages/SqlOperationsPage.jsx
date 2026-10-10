import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Database, 
  ShieldAlert, 
  Layers, 
  FileCode, 
  ArrowRight,
  Info
} from 'lucide-react';
import api from '../services/api';

export default function SqlOperationsPage() {
  const [activeTab, setActiveTab] = useState('DQL');
  const [examples, setExamples] = useState({ DDL: [], DML: [], DQL: [] });
  const [selectedExample, setSelectedExample] = useState(null);
  const [query, setQuery] = useState('SELECT p.PLANT_NAME, p.ENERGY_TYPE, e.EQUIPMENT_NAME, e.CATEGORY, e.QUANTITY, e.UNIT_COST\nFROM POWER_PLANTS p\nINNER JOIN EQUIPMENT e ON p.PLANT_ID = e.PLANT_ID\nORDER BY p.PLANT_NAME, e.EQUIPMENT_NAME');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExamples();
  }, []);

  const fetchExamples = async () => {
    try {
      const res = await api.get('/sql/examples');
      if (res.data?.success && res.data.examples) {
        setExamples(res.data.examples);
      }
    } catch (err) {
      console.error('Failed to load SQL examples:', err);
    }
  };

  const handleSelectExample = (ex) => {
    setSelectedExample(ex);
    setQuery(ex.sql);
    setError(null);
    setResult(null);
  };

  const handleExecute = async () => {
    if (!query.trim()) {
      setError('Please provide a SQL statement to execute.');
      return;
    }

    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post('/sql/execute', { query: query.trim() });
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Terminal className="w-6 h-6 text-emerald-400" />
          <span>SQL Operations Console (DDL · DML · DQL)</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Interactive relational database demonstration console executing live queries against Oracle 11g.
        </p>
      </div>

      {/* Security & Validator Limitations Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Security & Validator Policy: </span>
          <span>
            Only single-statement operations allowed. Multi-statement chaining, transaction control (<code className="text-slate-400 font-mono">COMMIT/ROLLBACK</code>), and administrative privilege statements (<code className="text-slate-400 font-mono">GRANT/REVOKE</code>) are blocked. Destructive <code className="text-slate-400 font-mono">DROP TABLE</code> commands are strictly permitted ONLY against disposable test tables (<code className="text-amber-400 font-mono">DISPOSABLE_TEST_TABLE</code> or tables prefixed with <code className="text-amber-400 font-mono">TEST_</code>).
          </span>
        </div>
      </div>

      {/* 3 Clearly Separated Sections (DDL, DML, DQL) */}
      <div className="flex border-b border-slate-800 space-x-2">
        {['DQL', 'DML', 'DDL'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              // select first example of tab if available
              if (examples[tab] && examples[tab].length > 0) {
                handleSelectExample(examples[tab][0]);
              }
            }}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === tab
                ? 'border-emerald-500 text-white bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>{tab} Demonstrations</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {examples[tab]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Curated Example Queries for Active Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>{activeTab} Curriculum Examples</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Click an example to load it directly into the query editor:
            </p>

            <div className="space-y-2.5">
              {examples[activeTab]?.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectExample(ex)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedExample?.title === ex.title
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                    <span>{ex.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{ex.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: SQL Editor & Output Console */}
        <div className="lg:col-span-2 space-y-4">
          {/* Query Editor Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>SQL Query Editor</span>
              </span>
              <button
                onClick={handleExecute}
                disabled={executing}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{executing ? 'Executing on Oracle...' : 'Execute Query'}</span>
              </button>
            </div>

            <textarea
              rows="6"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 selection:bg-emerald-900/60"
              placeholder="SELECT * FROM POWER_PLANTS;"
              spellCheck="false"
            />
          </div>

          {/* Execution Feedback / Error */}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs">
              <div className="flex items-center gap-2 font-semibold mb-1 text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Database Query Error:</span>
              </div>
              <p className="font-mono mt-1 text-[11px] bg-slate-950/80 p-2.5 rounded-lg border border-rose-900/40">
                {error}
              </p>
            </div>
          )}

          {/* Execution Result Banner */}
          {result && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 block">
                      Statement Succeeded: {result.statement_type || result.category}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Target: {result.engine} {result.is_fallback ? '(Dev Fallback)' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{result.elapsed_ms} ms</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>{result.rows_affected} {result.statement_type === 'DQL' ? 'row(s) returned' : 'row(s) affected'}</span>
                  </div>
                </div>
              </div>

              {/* Data Table for DQL queries */}
              {result.statement_type === 'DQL' && result.data && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Result Dataset</span>
                    <span className="text-slate-500 font-mono text-[11px]">{result.data.length} records</span>
                  </div>
                  {result.data.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Query executed successfully with 0 rows returned.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 uppercase font-semibold">
                          <tr>
                            {result.columns?.map((col) => (
                              <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                          {result.data.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-800/40">
                              {result.columns?.map((col) => (
                                <td key={col} className="py-2 px-3 whitespace-nowrap">
                                  {row[col] !== null && row[col] !== undefined ? String(row[col]) : (
                                    <span className="text-slate-600 italic">NULL</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
