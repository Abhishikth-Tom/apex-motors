import React, { useState } from 'react';
import { Plus, Edit3, PlusCircle, Trash2, X, AlertTriangle } from 'lucide-react';
import { Vehicle, InventoryHealth } from '../types';

interface AdminManagerProps {
  vehicles: Vehicle[];
  health: InventoryHealth | null;
  onAddVehicle: (data: Partial<Vehicle>) => Promise<boolean>;
  onUpdateVehicle: (id: string, data: Partial<Vehicle>) => Promise<boolean>;
  onRestockVehicle: (id: string, quantity: number) => Promise<boolean>;
  onDeleteVehicle: (id: string) => Promise<boolean>;
  onClose: () => void;
}

export const AdminManager: React.FC<AdminManagerProps> = ({
  vehicles,
  health,
  onAddVehicle,
  onUpdateVehicle,
  onRestockVehicle,
  onDeleteVehicle,
  onClose
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [restockVehicleTarget, setRestockVehicleTarget] = useState<Vehicle | null>(null);
  const [restockAmount, setRestockAmount] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  // Add vehicle form state
  const [addForm, setAddForm] = useState({
    make: '',
    model: '',
    category: 'SUV',
    price: '',
    quantity: '1',
    year: '2025',
    kmsDriven: '12000',
    fuelType: 'Petrol',
    city: 'Mumbai',
    imageUrl: '',
    description: ''
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await onAddVehicle({
      make: addForm.make.trim(),
      model: addForm.model.trim(),
      category: addForm.category,
      price: Number(addForm.price),
      quantity: Number(addForm.quantity),
      year: addForm.year ? Number(addForm.year) : undefined,
      kmsDriven: addForm.kmsDriven ? Number(addForm.kmsDriven) : 0,
      fuelType: addForm.fuelType,
      city: addForm.city.trim() || undefined,
      imageUrl: addForm.imageUrl.trim() || undefined,
      description: addForm.description.trim() || undefined
    });
    setSubmitting(false);
    if (success) {
      setShowAddModal(false);
      setAddForm({
        make: '',
        model: '',
        category: 'SUV',
        price: '',
        quantity: '1',
        year: '2025',
        kmsDriven: '12000',
        fuelType: 'Petrol',
        city: 'Mumbai',
        imageUrl: '',
        description: ''
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setSubmitting(true);
    const success = await onUpdateVehicle(editingVehicle.id, {
      make: editingVehicle.make,
      model: editingVehicle.model,
      category: editingVehicle.category,
      price: Number(editingVehicle.price),
      quantity: Number(editingVehicle.quantity),
      year: editingVehicle.year ? Number(editingVehicle.year) : undefined,
      kmsDriven: editingVehicle.kmsDriven !== undefined ? Number(editingVehicle.kmsDriven) : undefined,
      fuelType: editingVehicle.fuelType,
      city: editingVehicle.city,
      imageUrl: editingVehicle.imageUrl,
      description: editingVehicle.description
    });
    setSubmitting(false);
    if (success) {
      setEditingVehicle(null);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockVehicleTarget) return;
    const qty = Number(restockAmount);
    if (!qty || qty <= 0) return;
    setSubmitting(true);
    const success = await onRestockVehicle(restockVehicleTarget.id, qty);
    setSubmitting(false);
    if (success) {
      setRestockVehicleTarget(null);
      setRestockAmount('1');
    }
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(n);

  return (
    <section className="max-w-[1240px] mx-auto px-5 mb-10" data-testid="admin-manager-panel">
      <div className="bg-white border border-[#ddd9cf] rounded-sm shadow-md overflow-hidden">
        {/* Admin Header */}
        <div className="p-5 bg-[#183c32] text-white flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#c96535] block">
              Dealership Operations Console
            </span>
            <h2 className="font-serif text-2xl font-bold">Admin Inventory Controls</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#c96535] hover:bg-[#b05327] text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 rounded-sm shadow-sm transition-colors"
            >
              <Plus size={16} /> Add Vehicle
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
              title="Close admin panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Quick Stats bar inside Admin console */}
        {health && (
          <div className="bg-[#f2efe9] px-5 py-3 border-b border-[#ddd9cf] grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div>
              <span className="text-[#68736d] block text-[10px] uppercase">Models</span>
              <strong className="text-sm text-[#183c32]">{health.models}</strong>
            </div>
            <div>
              <span className="text-[#68736d] block text-[10px] uppercase">Warehouse Stock</span>
              <strong className="text-sm text-[#183c32]">{health.units} units</strong>
            </div>
            <div>
              <span className="text-[#68736d] block text-[10px] uppercase">Low Stock</span>
              <strong className={`text-sm ${health.lowStock > 0 ? 'text-amber-700' : 'text-[#183c32]'}`}>
                {health.lowStock}
              </strong>
            </div>
            <div>
              <span className="text-[#68736d] block text-[10px] uppercase">Sold Out</span>
              <strong className={`text-sm ${health.soldOut > 0 ? 'text-rose-700' : 'text-[#183c32]'}`}>
                {health.soldOut}
              </strong>
            </div>
            <div>
              <span className="text-[#68736d] block text-[10px] uppercase">Valuation</span>
              <strong className="text-sm text-[#183c32]">{formatMoney(health.value)}</strong>
            </div>
          </div>
        )}

        {/* Inventory Operational Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f9f8f5] border-b border-[#ddd9cf] text-[#68736d] font-mono uppercase text-[10px] tracking-wider">
                <th className="p-3.5">Vehicle</th>
                <th className="p-3.5">Category & Fuel</th>
                <th className="p-3.5">Year / KM</th>
                <th className="p-3.5">City</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Stock Quantity</th>
                <th className="p-3.5 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ede9e1]">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-[#faf8f4] transition-colors">
                  <td className="p-3.5 flex items-center gap-3">
                    <img
                      src={v.imageUrl || '/images/tata-nexon-ev.jpg'}
                      alt={v.model}
                      className="w-12 h-9 object-cover rounded-sm border border-[#ddd9cf]"
                    />
                    <div>
                      <strong className="font-semibold text-[#183c32] text-sm block">
                        {v.make} {v.model}
                      </strong>
                      <span className="text-[10px] font-mono text-[#8a948e]">{v.id}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="font-medium text-[#183c32]">{v.category}</span>
                    <span className="block text-[#68736d] text-[11px] font-mono">{v.fuelType || 'Petrol'}</span>
                  </td>
                  <td className="p-3.5 font-mono">
                    <span>{v.year ?? 'N/A'}</span>
                    <span className="block text-[#68736d] text-[11px]">
                      {v.kmsDriven !== undefined ? `${new Intl.NumberFormat('en-IN').format(v.kmsDriven)} km` : 'N/A'}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono">{v.city || 'Pan-India'}</td>
                  <td className="p-3.5 font-bold text-[#183c32]">{formatMoney(v.price)}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-mono font-bold ${
                        v.quantity === 0
                          ? 'bg-rose-100 text-rose-800'
                          : v.quantity <= 2
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {v.quantity} in stock
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => setRestockVehicleTarget(v)}
                      className="px-2.5 py-1.5 bg-[#183c32] hover:bg-[#235447] text-white text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors"
                      title="Restock units"
                    >
                      Restock
                    </button>
                    <button
                      onClick={() => setEditingVehicle({ ...v })}
                      className="px-2.5 py-1.5 border border-[#ddd9cf] hover:border-[#183c32] text-[#183c32] text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors"
                      title="Edit vehicle details"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Permanently remove ${v.make} ${v.model} from inventory?`)) {
                          onDeleteVehicle(v.id);
                        }
                      }}
                      className="p-1.5 text-[#9a4c36] hover:bg-rose-50 rounded-sm transition-colors"
                      title="Delete vehicle"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs modal-backdrop">
          <div className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-sm border border-[#ddd9cf] shadow-xl modal-content">
            <div className="flex items-center justify-between pb-3 border-b border-[#ede9e1]">
              <h3 className="font-serif text-xl font-bold text-[#183c32]">Add New Showroom Vehicle</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#68736d] hover:text-[#183c32]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Make / Brand *</label>
                  <input
                    required
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    placeholder="e.g. Tata, Mahindra, BMW"
                    value={addForm.make}
                    onChange={(e) => setAddForm({ ...addForm, make: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Model *</label>
                  <input
                    required
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    placeholder="e.g. Nexon EV, XUV 700"
                    value={addForm.model}
                    onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Category *</label>
                  <select
                    className="w-full h-9 px-2 border border-[#ddd9cf] rounded-sm outline-none"
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                  >
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Electric">Electric</option>
                    <option value="Hatchback">Hatchback</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Fuel Type *</label>
                  <select
                    className="w-full h-9 px-2 border border-[#ddd9cf] rounded-sm outline-none"
                    value={addForm.fuelType}
                    onChange={(e) => setAddForm({ ...addForm, fuelType: e.target.value })}
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Price (INR) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    placeholder="e.g. 1500000"
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Stock Quantity *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    placeholder="e.g. 3"
                    value={addForm.quantity}
                    onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Model Year</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    value={addForm.year}
                    onChange={(e) => setAddForm({ ...addForm, year: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">KM Driven</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    value={addForm.kmsDriven}
                    onChange={(e) => setAddForm({ ...addForm, kmsDriven: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">City</label>
                  <input
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    placeholder="e.g. Bengaluru"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Image URL</label>
                <input
                  className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                  placeholder="/images/... or https://..."
                  value={addForm.imageUrl}
                  onChange={(e) => setAddForm({ ...addForm, imageUrl: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full p-2.5 border border-[#ddd9cf] rounded-sm outline-none"
                  placeholder="Showroom description..."
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#ede9e1]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#ddd9cf] rounded-sm font-mono uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#183c32] hover:bg-[#235447] text-white rounded-sm font-mono uppercase tracking-wider"
                >
                  {submitting ? 'Adding...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs modal-backdrop">
          <div className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-sm border border-[#ddd9cf] shadow-xl modal-content">
            <div className="flex items-center justify-between pb-3 border-b border-[#ede9e1]">
              <h3 className="font-serif text-xl font-bold text-[#183c32]">
                Edit {editingVehicle.make} {editingVehicle.model}
              </h3>
              <button onClick={() => setEditingVehicle(null)} className="text-[#68736d] hover:text-[#183c32]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Price (INR) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    value={editingVehicle.price}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Stock Quantity *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    value={editingVehicle.quantity}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, quantity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Year</label>
                  <input
                    type="number"
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    value={editingVehicle.year ?? ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, year: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">KM Driven</label>
                  <input
                    type="number"
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    value={editingVehicle.kmsDriven ?? ''}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        kmsDriven: e.target.value ? Number(e.target.value) : undefined
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">City</label>
                  <input
                    className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                    value={editingVehicle.city ?? ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, city: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Image URL</label>
                <input
                  className="w-full h-9 px-3 border border-[#ddd9cf] rounded-sm outline-none"
                  value={editingVehicle.imageUrl ?? ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, imageUrl: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full p-2.5 border border-[#ddd9cf] rounded-sm outline-none"
                  value={editingVehicle.description ?? ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#ede9e1]">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-4 py-2 border border-[#ddd9cf] rounded-sm font-mono uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#183c32] hover:bg-[#235447] text-white rounded-sm font-mono uppercase tracking-wider"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockVehicleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs modal-backdrop">
          <div className="bg-white max-w-sm w-full p-6 rounded-sm border border-[#ddd9cf] shadow-xl modal-content">
            <div className="flex items-center justify-between pb-3 border-b border-[#ede9e1]">
              <h3 className="font-serif text-lg font-bold text-[#183c32]">Restock Vehicle</h3>
              <button onClick={() => setRestockVehicleTarget(null)} className="text-[#68736d] hover:text-[#183c32]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-4 text-xs">
              <p className="text-[#48534d]">
                Add units to inventory for{' '}
                <strong className="text-[#183c32]">
                  {restockVehicleTarget.make} {restockVehicleTarget.model}
                </strong>
                . Current stock is <strong>{restockVehicleTarget.quantity}</strong>.
              </p>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#68736d] mb-1">Units to Add *</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full h-10 px-3 text-base font-bold font-mono text-[#183c32] border border-[#ddd9cf] rounded-sm outline-none"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                {[1, 2, 5, 10].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRestockAmount(String(preset))}
                    className="flex-1 py-1.5 border border-[#ddd9cf] hover:border-[#183c32] rounded-sm font-mono text-xs"
                  >
                    +{preset}
                  </button>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#ede9e1]">
                <button
                  type="button"
                  onClick={() => setRestockVehicleTarget(null)}
                  className="px-4 py-2 border border-[#ddd9cf] rounded-sm font-mono uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#183c32] hover:bg-[#235447] text-white rounded-sm font-mono uppercase tracking-wider"
                >
                  {submitting ? 'Restocking...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
