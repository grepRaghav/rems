import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter, 
  Wrench, 
  UserCheck, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function MaintenancePage() {
  const [records, setRecords] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    record_id: '',
    equipment_id: '',
    maintenance_date: new Date().toISOString().substring(0, 10),
    maintenance_type: 'Preventive',
    technician_name: '',
    cost: 5000.0,
    status: 'Scheduled',
    notes: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMaintenance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const [maintRes, equipRes] = await Promise.all([
        api.get('/maintenance', { params }),
        api.get('/equipment')
      ]);

      if (maintRes.data?.success) setRecords(maintRes.data.data);
      if (equipRes.data?.success) setEquipmentList(equipRes.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, [statusFilter, typeFilter]);

  const openCreateModal = () => {
    setEditingRecord(null);
    setFormData({
      record_id: `MNT-${Math.floor(400 + Math.random() * 600)}`,
      equipment_id: equipmentList[0]?.EQUIPMENT_ID || '',
      maintenance_date: new Date().toISOString().substring(0, 10),
      maintenance_type: 'Preventive',
      technician_name: 'Lead Site Engineer',
      cost: 4500.0,
      status: 'Scheduled',
      notes: 'Scheduled routine health inspection and lubrications',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setFormData({
      record_id: rec.RECORD_ID,
      equipment_id: rec.EQUIPMENT_ID,
      maintenance_date: String(rec.MAINTENANCE_DATE).substring(0, 10),
      maintenance_type: rec.MAINTENANCE_TYPE,
      technician_name: rec.TECHNICIAN_NAME,
      cost: rec.COST,
      status: rec.STATUS,
      notes: rec.NOTES || '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (editingRecord) {
        await api.put(`/maintenance/${editingRecord.RECORD_ID}`, formData);
        setSuccessMsg(`Maintenance record '${formData.record_id}' updated.`);
      } else {
        await api.post('/maintenance', formData);
        setSuccessMsg(`Maintenance record '${formData.record_id}' scheduled.`);
      }
      setIsFormOpen(false);
      fetchMaintenance();
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
      await api.delete(`/maintenance/${deleteId}`);
      setSuccessMsg(`Maintenance record '${deleteId}' deleted.`);
      setDeleteId(null);
      fetchMaintenance();
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
            <CalendarCheck2 className="w-6 h-6 text-purple-400" />
            <span>Equipment Maintenance Records</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Oracle 11g Table: <code className="text-emerald-400 font-mono">MAINTENANCE_RECORDS</code> linking service work orders to equipment assets.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-emerald-950/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
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
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="">All Maintenance Types</option>
            <option value="Preventive">Preventive</option>
            <option value="Corrective">Corrective</option>
            <option value="Inspection">Inspection</option>
            <option value="Overhaul">Overhaul</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {(typeFilter || statusFilter) && (
          <button
            onClick={() => {
              setTypeFilter('');
              setStatusFilter('');
            }}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <LoadingSpinner message="Querying maintenance schedules from Oracle..." />
        ) : records.length === 0 ? (
          <EmptyState
            title="No maintenance records found"
            message="No maintenance tasks match the active filters."
            onAction={openCreateModal}
            actionLabel="Schedule Maintenance"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Target Equipment</th>
                  <th className="py-3 px-4">Plant</th>
                  <th className="py-3 px-4">Service Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Assigned Technician</th>
                  <th className="py-3 px-4 text-right">Cost ($)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {records.map((m) => (
                  <tr key={m.RECORD_ID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                      {m.RECORD_ID}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100 text-xs">
                      {m.EQUIPMENT_NAME}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {m.PLANT_NAME}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {String(m.MAINTENANCE_DATE).substring(0, 10)}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                        {m.MAINTENANCE_TYPE}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {m.TECHNICIAN_NAME}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                      ${Number(m.COST).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        m.STATUS === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        m.STATUS === 'In Progress' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {m.STATUS}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit order"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(m.RECORD_ID)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete order"
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
        title={editingRecord ? `Edit Work Order: ${editingRecord.RECORD_ID}` : 'Schedule Equipment Maintenance'}
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
                Record ID (Primary Key)
              </label>
              <input
                type="text"
                required
                disabled={!!editingRecord}
                value={formData.record_id}
                onChange={(e) => setFormData({ ...formData, record_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Target Equipment
              </label>
              <select
                required
                value={formData.equipment_id}
                onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {equipmentList.map((eq) => (
                  <option key={eq.EQUIPMENT_ID} value={eq.EQUIPMENT_ID}>
                    {eq.EQUIPMENT_ID} - {eq.EQUIPMENT_NAME}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Maintenance Date
              </label>
              <input
                type="date"
                required
                value={formData.maintenance_date}
                onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Maintenance Type
              </label>
              <select
                value={formData.maintenance_type}
                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
                <option value="Inspection">Inspection</option>
                <option value="Overhaul">Overhaul</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Assigned Technician
              </label>
              <input
                type="text"
                required
                value={formData.technician_name}
                onChange={(e) => setFormData({ ...formData, technician_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. Lead Electrical Engineer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                Cost ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
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
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Work Notes & Observations
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g. Completed insulation resistance test; all readings within threshold."
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
              {formSubmitting ? 'Saving...' : editingRecord ? 'Update Order' : 'Schedule Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Work Order"
        message={`Are you sure you want to delete Maintenance Order '${deleteId}'?`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
