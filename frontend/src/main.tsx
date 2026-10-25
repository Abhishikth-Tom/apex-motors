import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Navbar } from './components/Navbar';
import { ShowroomHero } from './components/ShowroomHero';
import { ShowroomFilters } from './components/ShowroomFilters';
import { VehicleCard } from './components/VehicleCard';
import { VehicleDetailModal } from './components/VehicleDetailModal';
import { AdminManager } from './components/AdminManager';
import { PurchaseHistoryModal } from './components/PurchaseHistoryModal';
import { AuthView } from './components/AuthView';
import { Session, Vehicle, InventoryHealth, PurchaseRecord, FilterState } from './types';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '/api';

const initialFilters: FilterState = {
  search: '',
  brand: '',
  category: '',
  fuel: '',
  maxPrice: '',
  modelYear: '',
  maxKm: '',
  sortBy: 'price_asc'
};

export function App() {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('apex-session') ?? 'null');
    } catch {
      return null;
    }
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [health, setHealth] = useState<InventoryHealth | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    try {
      const cur = JSON.parse(localStorage.getItem('apex-session') ?? 'null');
      if (cur?.user?.id) {
        const saved = localStorage.getItem(`apex-purchases-${cur.user.id}`);
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    } catch {
      return [];
    }
  });
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [purchasesModalOpen, setPurchasesModalOpen] = useState(false);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  // Re-hydrate purchase history whenever session user changes
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setPurchases([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`apex-purchases-${userId}`);
      if (saved) {
        setPurchases(JSON.parse(saved));
      }
    } catch {}
  }, [session?.user?.id]);

  const headers = useCallback(() => {
    return {
      Authorization: `Bearer ${session?.token}`,
      'Content-Type': 'application/json'
    };
  }, [session?.token]);

  const loadData = useCallback(async () => {
    if (!session?.token) return;

    const userId = session?.user?.id;
    const storageKey = userId ? `apex-purchases-${userId}` : null;

    try {
      const authHeaders = headers();
      const vehiclePromise = fetch(`${API}/vehicles`, { headers: authHeaders });
      const purchasesPromise = fetch(`${API}/purchases/me`, { headers: authHeaders });
      const dashboardPromise = isAdmin
        ? fetch(`${API}/dashboard`, { headers: authHeaders })
        : Promise.resolve(null);

      const [vRes, pRes, dRes] = await Promise.all([vehiclePromise, purchasesPromise, dashboardPromise]);

      if (vRes.ok) {
        const vData = await vRes.json();
        setVehicles(vData.data || []);
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        const serverPurchases: PurchaseRecord[] = pData.data || [];

        // Load local purchases to merge and preserve across serverless container recycles
        let localPurchases: PurchaseRecord[] = [];
        if (storageKey) {
          try {
            localPurchases = JSON.parse(localStorage.getItem(storageKey) || '[]');
          } catch {}
        }

        const map = new Map<string, PurchaseRecord>();
        localPurchases.forEach((p) => map.set(p.id, p));
        serverPurchases.forEach((p) => map.set(p.id, p));
        const merged = Array.from(map.values()).sort((a, b) =>
          b.purchased_at.localeCompare(a.purchased_at)
        );

        setPurchases(merged);
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(merged));
        }

        // Sync local purchases to server if server container was spun down
        if (merged.length > serverPurchases.length) {
          fetch(`${API}/purchases/sync`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ purchases: merged })
          }).catch(() => {});
        }
      }

      if (dRes && dRes.ok) {
        const dData = await dRes.json();
        setHealth(dData.data || null);
      }
    } catch (err) {
      console.error('Failed to load showroom data:', err);
    }
  }, [session?.token, session?.user?.id, isAdmin, headers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Notice auto-dismiss timer
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Client-side filtering & sorting for instant, fluid showroom responsiveness
  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => {
        // Keyword match across make, model, category, city, and description
        if (filters.search) {
          const q = filters.search.toLowerCase().trim();
          const target = `${v.make} ${v.model} ${v.category} ${v.city ?? ''} ${v.description ?? ''}`.toLowerCase();
          if (!target.includes(q)) return false;
        }

        // Brand / Make filter
        if (filters.brand && v.make.toLowerCase() !== filters.brand.toLowerCase()) {
          return false;
        }

        // Category filter
        if (filters.category && v.category.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }

        // Fuel Type filter
        if (filters.fuel && (v.fuelType ?? 'Petrol').toLowerCase() !== filters.fuel.toLowerCase()) {
          return false;
        }

        // Budget / Max Price filter
        if (filters.maxPrice && v.price > Number(filters.maxPrice)) {
          return false;
        }

        // Model Year filter
        if (filters.modelYear && v.year && v.year < Number(filters.modelYear)) {
          return false;
        }

        // KM Driven filter
        if (filters.maxKm && v.kmsDriven !== undefined && v.kmsDriven > Number(filters.maxKm)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'price_asc') return a.price - b.price;
        if (filters.sortBy === 'price_desc') return b.price - a.price;
        if (filters.sortBy === 'year_desc') return (b.year ?? 0) - (a.year ?? 0);
        if (filters.sortBy === 'kms_asc') return (a.kmsDriven ?? 0) - (b.kmsDriven ?? 0);
        return 0;
      });
  }, [vehicles, filters]);

  // Purchase Action with Concurrency Safety
  const handlePurchase = async (vehicle: Vehicle) => {
    setIsPurchasing(true);
    try {
      const res = await fetch(`${API}/vehicles/${vehicle.id}/purchase`, {
        method: 'POST',
        headers: headers()
      });

      const data = await res.json();
      if (!res.ok) {
        setNotice(data.message || 'Vehicle is currently unavailable for purchase.');
        return;
      }

      // Store purchase immediately in localStorage to guarantee persistence across logouts
      const newPurchase: PurchaseRecord = data.purchase || {
        id: data.data?.id || `ord-${Date.now()}`,
        purchased_at: new Date().toISOString(),
        price: vehicle.price,
        make: vehicle.make,
        model: vehicle.model,
        category: vehicle.category,
        fuelType: vehicle.fuelType,
        city: vehicle.city,
        imageUrl: vehicle.imageUrl
      };

      const userId = session?.user?.id;
      if (userId) {
        const storageKey = `apex-purchases-${userId}`;
        let currentList: PurchaseRecord[] = [];
        try {
          currentList = JSON.parse(localStorage.getItem(storageKey) || '[]');
        } catch {}
        const updated = [newPurchase, ...currentList.filter((p) => p.id !== newPurchase.id)];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setPurchases(updated);
      }

      setNotice(`Congratulations! Your purchase of the ${vehicle.make} ${vehicle.model} has been confirmed.`);
      if (selectedVehicle?.id === vehicle.id) {
        setSelectedVehicle(null);
      }
      await loadData();
    } catch {
      setNotice('Purchase transaction failed. Please check your connection.');
    } finally {
      setIsPurchasing(false);
    }
  };

  // Admin: Add Vehicle
  const handleAddVehicle = async (vehicleData: Partial<Vehicle>): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/vehicles`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(vehicleData)
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.message || 'Could not add vehicle.');
        return false;
      }
      setNotice(`Added ${data.data.make} ${data.data.model} to inventory.`);
      await loadData();
      return true;
    } catch {
      setNotice('Failed to add vehicle.');
      return false;
    }
  };

  // Admin: Update Vehicle
  const handleUpdateVehicle = async (id: string, vehicleData: Partial<Vehicle>): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/vehicles/${id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(vehicleData)
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.message || 'Could not update vehicle.');
        return false;
      }
      setNotice(`Updated ${data.data.make} ${data.data.model}.`);
      await loadData();
      return true;
    } catch {
      setNotice('Failed to update vehicle.');
      return false;
    }
  };

  // Admin: Restock Vehicle
  const handleRestock = async (id: string, quantity: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/vehicles/${id}/restock`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ quantity })
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.message || 'Could not restock vehicle.');
        return false;
      }
      setNotice(`Restocked ${data.data.make} ${data.data.model}. New quantity: ${data.data.quantity}.`);
      await loadData();
      return true;
    } catch {
      setNotice('Failed to restock vehicle.');
      return false;
    }
  };

  // Admin: Delete Vehicle
  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/vehicles/${id}`, {
        method: 'DELETE',
        headers: headers()
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.message || 'Could not remove vehicle.');
        return false;
      }
      setNotice('Vehicle removed from inventory.');
      await loadData();
      return true;
    } catch {
      setNotice('Failed to delete vehicle.');
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('apex-session');
    setSession(null);
  };

  if (!session) {
    return <AuthView onAuthenticated={setSession} apiBase={API} />;
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#f5f3ee]">
      <Navbar
        session={session}
        onLogout={handleLogout}
        adminOpen={adminOpen}
        onToggleAdmin={() => setAdminOpen(!adminOpen)}
        onOpenPurchases={() => setPurchasesModalOpen(true)}
        purchaseCount={purchases.length}
      />

      <ShowroomHero isAdmin={isAdmin} health={health} />

      {/* Global Toast Notification */}
      {notice && (
        <div className="px-5">
          <div className="toast-notification">
            <span>{notice}</span>
            <button
              onClick={() => setNotice(null)}
              className="text-[#174b39] hover:text-[#c96535] font-bold text-sm ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Admin Operational Management Console */}
      {isAdmin && adminOpen && (
        <AdminManager
          vehicles={vehicles}
          health={health}
          onAddVehicle={handleAddVehicle}
          onUpdateVehicle={handleUpdateVehicle}
          onRestockVehicle={handleRestock}
          onDeleteVehicle={handleDelete}
          onClose={() => setAdminOpen(false)}
        />
      )}

      {/* Showroom Discovery & Filter Controls */}
      <ShowroomFilters
        filters={filters}
        onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
        onReset={() => setFilters(initialFilters)}
        vehicles={vehicles}
        totalResults={filteredVehicles.length}
      />

      {/* Showroom Vehicle Grid */}
      <section className="catalogue-grid" aria-label="Available Vehicles">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-3 bg-white border border-[#e3dfd6] p-8 rounded-sm">
            <h3 className="font-serif text-2xl font-bold text-[#183c32]">No matching vehicles found</h3>
            <p className="text-xs text-[#67706a] max-w-md mx-auto">
              We couldn't find any vehicles matching your current search and filter combination. Try adjusting your
              budget, brand, or mileage criteria.
            </p>
            <button
              onClick={() => setFilters(initialFilters)}
              className="px-4 py-2 bg-[#183c32] text-white text-xs font-mono uppercase tracking-wider rounded-sm hover:bg-[#235447] transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isAdmin={isAdmin}
              onOpenDetails={(v) => setSelectedVehicle(v)}
              onPurchase={handlePurchase}
              onEdit={(v) => {
                setAdminOpen(true);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              onRestock={(v) => {
                setAdminOpen(true);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              onDelete={(v) => handleDelete(v.id)}
              isPurchasing={isPurchasing}
            />
          ))
        )}
      </section>

      {/* Buyer-Facing Vehicle Detail View / Modal */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onPurchase={handlePurchase}
        isPurchasing={isPurchasing}
      />

      {/* Customer Purchase History Modal */}
      {purchasesModalOpen && (
        <PurchaseHistoryModal
          purchases={purchases}
          onClose={() => setPurchasesModalOpen(false)}
          loading={purchasesLoading}
        />
      )}
    </main>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
