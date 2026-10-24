import React from 'react';
import { Calendar, Gauge, Fuel, MapPin, ShoppingBag, Eye, Edit3, PlusCircle, Trash2 } from 'lucide-react';
import { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  isAdmin: boolean;
  onOpenDetails: (vehicle: Vehicle) => void;
  onPurchase: (vehicle: Vehicle) => void;
  onEdit?: (vehicle: Vehicle) => void;
  onRestock?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
  isPurchasing?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  isAdmin,
  onOpenDetails,
  onPurchase,
  onEdit,
  onRestock,
  onDelete,
  isPurchasing = false
}) => {
  const isAvailable = vehicle.quantity > 0;

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(n);

  const formatKm = (km?: number) =>
    km !== undefined && km !== null ? `${new Intl.NumberFormat('en-IN').format(km)} km` : 'Pre-owned';

  return (
    <article className="vehicle-card group" data-testid={`vehicle-card-${vehicle.id}`}>
      {/* Vehicle Image Container */}
      <div
        className="vehicle-card-image-wrap cursor-pointer"
        onClick={() => onOpenDetails(vehicle)}
        title="Click to view full specifications"
      >
        <img
          src={vehicle.imageUrl || '/images/tata-nexon-ev.jpg'}
          alt={`${vehicle.make} ${vehicle.model}`}
          loading="lazy"
          onError={(e) => {
            // Graceful fallback if network image fails
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1592833159155-c62df1b65634?auto=format&fit=crop&w=900&q=80';
          }}
        />

        {/* Category Pill Tag */}
        <span className="absolute top-3 left-3 bg-[#183c32]/90 backdrop-blur-xs text-white text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-sm shadow-xs">
          {vehicle.category}
        </span>

        {/* Buyer-Facing Availability Status (NO internal stock count revealed to buyers!) */}
        <span
          className={`absolute top-3 right-3 text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-sm shadow-xs ${
            isAvailable
              ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/30'
              : 'bg-rose-950/90 text-rose-200 border border-rose-500/30'
          }`}
        >
          {isAvailable ? 'Certified · Ready to View' : 'Sold Out'}
        </span>

        {/* Quick View Hover Overlay Button */}
        <div className="absolute inset-0 bg-[#183c32]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-[#183c32] text-xs font-mono tracking-wider uppercase px-4 py-2 rounded-sm shadow-md flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye size={14} /> View Details
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Model Title */}
          <h2
            className="font-serif text-2xl text-[#17221f] tracking-tight cursor-pointer hover:text-[#c96535] transition-colors"
            onClick={() => onOpenDetails(vehicle)}
          >
            {vehicle.make} <em className="text-[#c96535] font-serif not-italic">{vehicle.model}</em>
          </h2>

          {/* Description Excerpt */}
          <p className="text-xs text-[#67706a] leading-relaxed line-clamp-2 mt-2">
            {vehicle.description || 'Certified multi-point inspected pre-owned vehicle with verified history.'}
          </p>

          {/* Buyer-Facing Card Metadata Grid: Year, KM, Fuel, City */}
          <div className="mt-4 pt-4 border-t border-[#ede9e1] grid grid-cols-2 gap-2 text-xs font-mono text-[#546059]">
            <div className="flex items-center gap-1.5" title="Registration Year">
              <Calendar size={13} className="text-[#c96535] shrink-0" />
              <span>{vehicle.year ?? 'Verified'}</span>
            </div>

            <div className="flex items-center gap-1.5" title="Kilometres Driven">
              <Gauge size={13} className="text-[#c96535] shrink-0" />
              <span>{formatKm(vehicle.kmsDriven)}</span>
            </div>

            <div className="flex items-center gap-1.5" title="Fuel Type">
              <Fuel size={13} className="text-[#c96535] shrink-0" />
              <span>{vehicle.fuelType || 'Petrol'}</span>
            </div>

            <div className="flex items-center gap-1.5" title="Location City">
              <MapPin size={13} className="text-[#c96535] shrink-0" />
              <span>{vehicle.city || 'Pan-India'}</span>
            </div>
          </div>
        </div>

        {/* Footer with Price and Actions */}
        <div className="mt-5 pt-4 border-t border-[#ede9e1] flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-[#79857e]">All-Inclusive</span>
            <b className="text-lg font-bold text-[#183c32] tracking-tight">{formatMoney(vehicle.price)}</b>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenDetails(vehicle)}
              className="px-3 py-2 text-xs font-mono tracking-wider uppercase border border-[#ddd9cf] hover:border-[#183c32] text-[#183c32] rounded-sm transition-colors"
              title="Inspect specifications"
            >
              Specs
            </button>

            <button
              disabled={!isAvailable || isPurchasing}
              onClick={() => onPurchase(vehicle)}
              className={`px-3.5 py-2 text-xs font-mono tracking-wider uppercase flex items-center gap-1.5 rounded-sm transition-all ${
                isAvailable
                  ? 'bg-[#183c32] hover:bg-[#235447] text-white shadow-xs'
                  : 'bg-[#cfd3ce] text-[#787f7a] cursor-not-allowed'
              }`}
              title={isAvailable ? 'Purchase vehicle immediately' : 'Vehicle is currently sold out'}
            >
              <ShoppingBag size={14} />
              <span>{isAvailable ? 'Buy' : 'Sold Out'}</span>
            </button>
          </div>
        </div>

        {/* Admin Operational Actions: shown only when logged in as Admin */}
        {isAdmin && (
          <div className="mt-3 pt-3 border-t border-dashed border-[#d9d5cb] bg-[#faf8f4] -mx-5 -mb-5 p-3 flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-[#67706a]">
              Admin Stock: <strong className="text-[#183c32]">{vehicle.quantity}</strong> units
            </span>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(vehicle)}
                  className="p-1.5 text-[#183c32] hover:text-[#c96535] hover:bg-white rounded transition-colors"
                  title="Edit details & price"
                >
                  <Edit3 size={15} />
                </button>
              )}
              {onRestock && (
                <button
                  onClick={() => onRestock(vehicle)}
                  className="p-1.5 text-[#183c32] hover:text-emerald-700 hover:bg-white rounded transition-colors"
                  title="Add stock units"
                >
                  <PlusCircle size={15} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(vehicle)}
                  className="p-1.5 text-[#9a4c36] hover:text-rose-700 hover:bg-white rounded transition-colors"
                  title="Delete vehicle"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
