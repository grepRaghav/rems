import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter, 
  Building2, 
  Coins, 
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    plant_id: '',
    equipment_name: '',
    category: 'Inverter',
    quantity: 1,
    unit_cost: 0.0,
    status: 'Operational',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const [equipRes, plantsRes] = await Promise.all([
        api.get('/equipment', { params }),
        api.get('/plants')
      ]);

      if (equipRes.data?.success) setEquipment(equipRes.data.data);
      if (plantsRes.data?.success) setPlants(plantsRes.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEquipment();
  };

  const openCreateModal = () => {
    setEditingEquip(null);
    setFormData({
      equipment_id: `EQ-${Math.floor(200 + Math.random() * 800)}`,
      plant_id: plants[0]?.PLANT_ID || '',
      equipment_name: '',
      category: 'Inverter',
      quantity: 1,
      unit_cost: 15000.0,
      status: 'Operational',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (eq) => {
    setEditingEquip(eq);
    setFormData({
      equipment_id: eq.EQUIPMENT_ID,
      plant_id: eq.PLANT_ID,
      equipment_name: eq.EQUIPMENT_NAME,
      category: eq.CATEGORY,
      quantity: eq.QUANTITY,
      unit_cost: eq.UNIT_COST,
      status: eq.STATUS,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (editingEquip) {
        await api.put(`/equipment/${editingEquip.EQUIPMENT_ID}`, formData);
        setSuccessMsg(`Equipment '${formData.equipment_name}' updated.`);
      } else {
        await api.post('/equipment', formData);
        setSuccessMsg(`Equipment '${formData.equipment_name}' added.`);
      }
      setIsFormOpen(false);
      fetchEquipment();
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
      await api.delete(`/equipment/${deleteId}`);
      setSuccessMsg(`Equipment '${deleteId}' deleted.`);
      setDeleteId(null);
      fetchEquipment();
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
            <Wrench className="w-6 h-6 text-blue-400" />
            <span>Equipment Assets Management</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Oracle 11g Table: <code className="text-emerald-400 font-mono">EQUIPMENT</code> with Foreign Key to <code className="text-slate-300 font-mono">POWER_PLANTS(PLANT_ID)</code>.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-emerald-950/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Equipment Asset</span>
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
            placeholder="Search equipment ID, name, or plant..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Solar Panel Array">Solar Panel Array</option>
            <option value="Inverter">Inverter</option>
            <option value="Wind Turbine">Wind Turbine</option>
            <option value="Turbine Gearbox">Turbine Gearbox</option>
            <option value="Turbine">Turbine</option>
            <option value="Transformer">Transformer</option>
            <option value="Generator">Generator</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Operational">Operational</option>
            <option value="Needs Service">Needs Service</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <LoadingSpinner message="Fetching equipment records from Oracle..." />
        ) : equipment.length === 0 ? (
          <EmptyState
            title="No equipment assets found"
            message="No equipment items match the specified filters."
            onAction={openCreateModal}
            actionLabel="Register Equipment"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Equipment ID</th>
                  <th className="py-3 px-4">Equipment Name</th>
                  <th className="py-3 px-4">Plant Facility</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Valuation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {equipment.map((eq) => (
                  <tr key={eq.EQUIPMENT_ID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                      {eq.EQUIPMENT_ID}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      {eq.EQUIPMENT_NAME}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[150px]">{eq.PLANT_NAME}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <span className="bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                        {eq.CATEGORY}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-200">
                      {eq.QUANTITY}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      ${Number(eq.UNIT_COST).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                      ${Number(eq.TOTAL_VALUATION || (eq.QUANTITY * eq.UNIT_COST)).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        eq.STATUS === 'Operational' ? 'bg-emerald-500/10 text-emerald-400' :
                        eq.STATUS === 'Needs Service' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {eq.STATUS}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(eq)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit equipment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(eq.EQUIPMENT_ID)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete equipment"
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
        title={editingEquip ? `Edit Equipment: ${editingEquip.EQUIPMENT_NAME}` : 'Add New Equipment Asset'}
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
                Equipment ID (Primary Key)
              </label>
              <input
                type="text"
                required
                disabled={!!editingEquip}
                value={formData.equipment_id}
                onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. EQ-209"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Plant Facility (Foreign Key)
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Equipment Name
            </label>
            <input
              type="text"
              required
              value={formData.equipment_name}
              onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g. SMA Central Solar Inverter"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="Solar Panel Array">Solar Panel Array</option>
                <option value="Inverter">Inverter</option>
                <option value="Wind Turbine">Wind Turbine</option>
                <option value="Turbine Gearbox">Turbine Gearbox</option>
                <option value="Turbine">Turbine</option>
                <option value="Transformer">Transformer</option>
                <option value="Generator">Generator</option>
                <option value="Battery Storage">Battery Storage</option>
              </select>
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
                <option value="Operational">Operational</option>
                <option value="Needs Service">Needs Service</option>
                <option value="Under Repair">Under Repair</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Quantity Units
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Unit Cost ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
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
              {formSubmitting ? 'Saving...' : editingEquip ? 'Update Equipment' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Equipment Asset"
        message={`Are you sure you want to delete Equipment Asset '${deleteId}'? In Oracle, this will CASCADE and delete related maintenance service history.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
