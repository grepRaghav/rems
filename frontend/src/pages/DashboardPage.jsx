import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  Wrench, 
  Activity, 
  CalendarCheck2, 
  Plus, 
  Terminal, 
  ArrowUpRight, 
  TrendingUp, 
  Zap, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import DbStatusBanner from '../components/DbStatusBanner';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data?.success) {
        setData(res.data);
      } else {
        setError(res.data?.error || 'Failed to load dashboard metrics.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating DBMS system statistics from database..." />;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="w-6 h-6 text-rose-400" />
          <h2 className="text-lg font-semibold">Error Loading Dashboard</h2>
        </div>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, energy_by_type, recent_generation, recent_maintenance, db_status } = data || {};

  return (
    <div className="space-y-8">
      {/* DB Connection Banner */}
      <DbStatusBanner dbStatus={db_status} />

      {/* Page Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-sm text-slate-400">
            Real-time status of generation assets, equipment telemetry, and operational schedules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardStats}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/plants"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-emerald-950/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plant</span>
          </Link>
          <Link
            to="/sql-operations"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition-colors"
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>SQL Console</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Power Plants */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Power Plants</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{stats?.total_plants || 0}</span>
            <span className="text-xs font-medium text-amber-400">
              {(stats?.total_capacity_kw || 0).toLocaleString()} kW
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Active renewable grid installations</p>
        </div>

        {/* Card 2: Equipment Assets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Equipment Assets</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{stats?.total_equipment || 0}</span>
            <span className="text-xs font-medium text-blue-400">
              {stats?.total_equipment_units || 0} Total Units
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Turbines, inverters & arrays</p>
        </div>

        {/* Card 3: Energy Generated */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Generation</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">
              {(stats?.total_energy_kwh || 0).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-400">kWh</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Avg Efficiency: {stats?.avg_efficiency_percent || 0}%</p>
        </div>

        {/* Card 4: Maintenance Work */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Maintenance</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{stats?.active_maintenance || 0}</span>
            <span className="text-xs font-medium text-purple-400">Work Orders</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Scheduled or ongoing field jobs</p>
        </div>
      </div>

      {/* Energy Breakdown & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capacity By Energy Type */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-100">Generation by Source</h2>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-4">
            {energy_by_type && energy_by_type.length > 0 ? (
              energy_by_type.map((item) => (
                <div key={item.ENERGY_TYPE} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-200">{item.ENERGY_TYPE}</span>
                    <span className="text-slate-400">{Number(item.TOTAL_KW).toLocaleString()} kW ({item.PLANT_COUNT} plants)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (Number(item.TOTAL_KW) / (stats?.total_capacity_kw || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No energy source records yet.</p>
            )}
          </div>
        </div>

        {/* Recent Energy Generation Records */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-100">Recent Generation Logs</h2>
            <Link to="/generation" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Log ID</th>
                  <th className="py-2.5 px-3">Plant</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Energy (kWh)</th>
                  <th className="py-2.5 px-3 text-right">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recent_generation && recent_generation.length > 0 ? (
                  recent_generation.map((row) => (
                    <tr key={row.GENERATION_ID} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-medium text-emerald-400">{row.GENERATION_ID}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-200">{row.PLANT_NAME}</td>
                      <td className="py-2.5 px-3 text-slate-400">{String(row.GENERATION_DATE).substring(0, 10)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">{Number(row.ENERGY_KWH).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                          {row.EFFICIENCY_PERCENT}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-slate-500">No generation entries recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Maintenance Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-100">Equipment Maintenance Pipeline</h2>
          <Link to="/maintenance" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium">
            Manage Work Orders <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Work Order</th>
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3">Service Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recent_maintenance && recent_maintenance.length > 0 ? (
                recent_maintenance.map((m) => (
                  <tr key={m.RECORD_ID} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-emerald-400">{m.RECORD_ID}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">{m.EQUIPMENT_NAME}</td>
                    <td className="py-2.5 px-3 text-slate-400">{String(m.MAINTENANCE_DATE).substring(0, 10)}</td>
                    <td className="py-2.5 px-3 text-slate-300">{m.MAINTENANCE_TYPE}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        m.STATUS === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        m.STATUS === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {m.STATUS}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-slate-500">No maintenance jobs in record.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
