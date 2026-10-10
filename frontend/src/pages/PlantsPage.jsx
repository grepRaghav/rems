import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter, 
  MapPin, 
  Zap, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function PlantsPage() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [formData, setFormData] = useState({
    plant_id: '',
    plant_name: '',
    energy_type: 'Solar',
    location: '',
    capacity_kw: '',
    install_date: new Date().toISOString().substring(0, 10),
    status: 'Active',
    operator_name: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPlants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.energy_type = typeFilter;

      const res = await api.get('/plants', { params });
      if (res.data?.success) {
        setPlants(res.data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPlants();
  };

  const openCreateModal = () => {
    setEditingPlant(null);
    setFormData({
      plant_id: `PLANT-${Math.floor(100 + Math.random() * 900)}`,
      plant_name: '',
      energy_type: 'Solar',
      location: '',
      capacity_kw: '',
      install_date: new Date().toISOString().substring(0, 10),
      status: 'Active',
      operator_name: '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (plant) => {
    setEditingPlant(plant);
    setFormData({
      plant_id: plant.PLANT_ID,
      plant_name: plant.PLANT_NAME,
      energy_type: plant.ENERGY_TYPE,
      location: plant.LOCATION,
      capacity_kw: plant.CAPACITY_KW,
      install_date: String(plant.INSTALL_DATE).substring(0, 10),
      status: plant.STATUS,
      operator_name: plant.OPERATOR_NAME || '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (editingPlant) {
        await api.put(`/plants/${editingPlant.PLANT_ID}`, formData);
        setSuccessMsg(`Plant '${formData.plant_name}' updated successfully.`);
      } else {
        await api.post('/plants', formData);
        setSuccessMsg(`Plant '${formData.plant_name}' created successfully.`);
      }
      setIsFormOpen(false);
      fetchPlants();
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
      await api.delete(`/plants/${deleteId}`);
      setSuccessMsg(`Plant '${deleteId}' deleted.`);
      setDeleteId(null);
      fetchPlants();
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
            <Flame className="w-6 h-6 text-amber-400" />
            <span>Power Plants Management</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Oracle 11g Table: <code className="text-emerald-400 font-mono">POWER_PLANTS</code> with primary key <code className="text-slate-300 font-mono">PLANT_ID</code>.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-emerald-950/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Power Plant</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plant ID, name or location..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="">All Energy Types</option>
            <option value="Solar">Solar</option>
            <option value="Wind">Wind</option>
            <option value="Hydro">Hydro</option>
            <option value="Biomass">Biomass</option>
            <option value="Geothermal">Geothermal</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Plants Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <LoadingSpinner message="Fetching plant records from Oracle..." />
        ) : plants.length === 0 ? (
          <EmptyState
            title="No power plants found"
            message="No plant records match your query filter criteria."
            onAction={openCreateModal}
            actionLabel="Register First Plant"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Plant ID</th>
                  <th className="py-3 px-4">Plant Name</th>
                  <th className="py-3 px-4">Energy Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Capacity (kW)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {plants.map((plant) => (
                  <tr key={plant.PLANT_ID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                      {plant.PLANT_ID}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      {plant.PLANT_NAME}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plant.ENERGY_TYPE === 'Solar' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        plant.ENERGY_TYPE === 'Wind' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        plant.ENERGY_TYPE === 'Hydro' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {plant.ENERGY_TYPE}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs flex items-center gap-1.5 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{plant.LOCATION}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-100">
                      {Number(plant.CAPACITY_KW).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plant.STATUS === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                        plant.STATUS === 'Maintenance' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {plant.STATUS}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {plant.OPERATOR_NAME || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(plant)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit plant"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(plant.PLANT_ID)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete plant"
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

      {/* Create / Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingPlant ? `Edit Plant: ${editingPlant.PLANT_NAME}` : 'Register New Power Plant'}
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
                Plant ID (Primary Key)
              </label>
              <input
                type="text"
                required
                disabled={!!editingPlant}
                value={formData.plant_id}
                onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. PLANT-109"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Energy Type
              </label>
              <select
                value={formData.energy_type}
                onChange={(e) => setFormData({ ...formData, energy_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="Solar">Solar</option>
                <option value="Wind">Wind</option>
                <option value="Hydro">Hydro</option>
                <option value="Biomass">Biomass</option>
                <option value="Geothermal">Geothermal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Plant Name
            </label>
            <input
              type="text"
              required
              value={formData.plant_name}
              onChange={(e) => setFormData({ ...formData, plant_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g. Thar Desert Solar Phase II"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Location
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. Jodhpur, Rajasthan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Capacity (kW)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.capacity_kw}
                onChange={(e) => setFormData({ ...formData, capacity_kw: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. 50000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Installation Date
              </label>
              <input
                type="date"
                required
                value={formData.install_date}
                onChange={(e) => setFormData({ ...formData, install_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
                <option value="Decommissioned">Decommissioned</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Operator Name / Organization
            </label>
            <input
              type="text"
              value={formData.operator_name}
              onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g. State Renewable Power Corp"
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
              {formSubmitting ? 'Saving to Oracle...' : editingPlant ? 'Update Plant' : 'Create Plant'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Power Plant"
        message={`Are you sure you want to delete Power Plant '${deleteId}'? In Oracle, this will CASCADE and delete related equipment & generation records.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
