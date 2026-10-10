import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter, 
  Building2, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function GenerationPage() {
  const [records, setRecords] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [plantFilter, setPlantFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGen, setEditingGen] = useState(null);
  const [formData, setFormData] = useState({
    generation_id: '',
    plant_id: '',
    generation_date: new Date().toISOString().substring(0, 10),
    energy_kwh: '',
    efficiency_percent: '',
    peak_output_kw: '',
    remarks: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGeneration = async () => {
    setLoading(true);
    try {
      const params = {};
      if (plantFilter) params.plant_id = plantFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const [genRes, plantsRes] = await Promise.all([
        api.get('/generation', { params }),
        api.get('/plants')
      ]);

      if (genRes.data?.success) setRecords(genRes.data.data);
      if (plantsRes.data?.success) setPlants(plantsRes.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeneration();
  }, [plantFilter, dateFrom, dateTo]);

  const openCreateModal = () => {
    setEditingGen(null);
    setFormData({
      generation_id: `GEN-${Math.floor(300 + Math.random() * 700)}`,
      plant_id: plants[0]?.PLANT_ID || '',
      generation_date: new Date().toISOString().substring(0, 10),
      energy_kwh: 250000.0,
      efficiency_percent: 92.5,
      peak_output_kw: 35000.0,
      remarks: 'Normal grid dispatch during daylight',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (gen) => {
    setEditingGen(gen);
    setFormData({
      generation_id: gen.GENERATION_ID,
      plant_id: gen.PLANT_ID,
      generation_date: String(gen.GENERATION_DATE).substring(0, 10),
      energy_kwh: gen.ENERGY_KWH,
      efficiency_percent: gen.EFFICIENCY_PERCENT,
      peak_output_kw: gen.PEAK_OUTPUT_KW || '',
      remarks: gen.REMARKS || '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (editingGen) {
        await api.put(`/generation/${editingGen.GENERATION_ID}`, formData);
        setSuccessMsg(`Generation log '${formData.generation_id}' updated.`);
      } else {
        await api.post('/generation', formData);
        setSuccessMsg(`Generation log '${formData.generation_id}' recorded.`);
      }
      setIsFormOpen(false);
      fetchGeneration();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/generation/${deleteId}`);
      setSuccessMsg(`Generation record '${deleteId}' deleted.`);
      setDeleteId(null);
      fetchGeneration();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>Energy Generation Logs</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Oracle 11g Table: <code className="text-emerald-400 font-mono">ENERGY_GENERATION</code> recording daily telemetry, kWh yields, and efficiency ratings.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-emerald-950/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Daily Output</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={plantFilter}
            onChange={(e) => setPlantFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="">All Power Plants</option>
            {plants.map((p) => (
              <option key={p.PLANT_ID} value={p.PLANT_ID}>
                {p.PLANT_NAME} ({p.PLANT_ID})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {(plantFilter || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setPlantFilter('');
              setDateFrom('');
              setDateTo('');
            }}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <LoadingSpinner message="Querying generation records from Oracle..." />
        ) : records.length === 0 ? (
          <EmptyState
            title="No generation records found"
            message="No energy telemetry matches the date or plant filters."
            onAction={openCreateModal}
            actionLabel="Record Generation"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Plant Facility</th>
                  <th className="py-3 px-4">Log Date</th>
                  <th className="py-3 px-4 text-right">Energy Yield (kWh)</th>
                  <th className="py-3 px-4 text-right">Efficiency</th>
                  <th className="py-3 px-4 text-right">Peak Output (kW)</th>
                  <th className="py-3 px-4">Operational Remarks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {records.map((r) => (
                  <tr key={r.GENERATION_ID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                      {r.GENERATION_ID}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-100">
                      {r.PLANT_NAME}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {String(r.GENERATION_DATE).substring(0, 10)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                      {Number(r.ENERGY_KWH).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {r.EFFICIENCY_PERCENT}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {r.PEAK_OUTPUT_KW ? `${Number(r.PEAK_OUTPUT_KW).toLocaleString()} kW` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate">
                      {r.REMARKS || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(r.GENERATION_ID)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingGen ? `Edit Generation Log: ${editingGen.GENERATION_ID}` : 'Log Energy Output'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Generation ID
              </label>
              <input
                type="text"
                required
                disabled={!!editingGen}
                value={formData.generation_id}
                onChange={(e) => setFormData({ ...formData, generation_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Plant Facility
              </label>
              <select
                required
                value={formData.plant_id}
                onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {plants.map((p) => (
                  <option key={p.PLANT_ID} value={p.PLANT_ID}>
                    {p.PLANT_ID} - {p.PLANT_NAME}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Generation Date
              </label>
              <input
                type="date"
                required
                value={formData.generation_date}
                onChange={(e) => setFormData({ ...formData, generation_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Energy Produced (kWh)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.energy_kwh}
                onChange={(e) => setFormData({ ...formData, energy_kwh: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. 385000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Efficiency (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={formData.efficiency_percent}
                onChange={(e) => setFormData({ ...formData, efficiency_percent: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. 94.2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Peak Output (kW)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.peak_output_kw}
                onChange={(e) => setFormData({ ...formData, peak_output_kw: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. 48200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Remarks / Meteorological Conditions
            </label>
            <textarea
              rows="2"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g. High irradiation with zero cloud cover recorded"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
            >
              {formSubmitting ? 'Recording...' : editingGen ? 'Update Log' : 'Save Log'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Generation Log"
        message={`Are you sure you want to delete Generation Log '${deleteId}'?`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
