import React, { useEffect } from 'react';
import { X, ShieldCheck, Check, Calendar, Gauge, Fuel, MapPin, ShoppingBag, Award, Sparkles } from 'lucide-react';
import { Vehicle } from '../types';
import { formatMoney, formatKm } from '../utils';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onPurchase: (vehicle: Vehicle) => void;
  isPurchasing?: boolean;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  onClose,
  onPurchase,
  isPurchasing = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!vehicle) return null;

  const isAvailable = vehicle.quantity > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0e221d]/80 backdrop-blur-sm modal-backdrop"
      onClick={onClose}
      data-testid="vehicle-detail-modal"
    >
      <div
        className="bg-white max-w-3xl w-full max-h-[92vh] overflow-y-auto rounded-sm border border-[#ddd9cf] shadow-2xl relative modal-content flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white text-[#183c32] hover:text-[#c96535] rounded-full shadow-md transition-all"
          aria-label="Close vehicle details"
        >
          <X size={20} />
        </button>

        {/* Hero Image Section */}
        <div className="relative h-64 sm:h-84 bg-[#e9e6df] overflow-hidden">
          <img
            src={vehicle.imageUrl || '/images/tata-nexon-ev.jpg'}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1592833159155-c62df1b65634?auto=format&fit=crop&w=900&q=80';
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-6">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#c96535] text-white text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-sm">
                  {vehicle.category}
                </span>
                <span className="bg-white/20 backdrop-blur-xs text-white text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-sm">
                  {vehicle.fuelType || 'Petrol'}
                </span>
                <span
                  className={`text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-sm ${
                    isAvailable ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {isAvailable ? 'In Stock · Certified' : 'Sold Out'}
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
                {vehicle.make} <span className="font-serif italic font-normal text-[#f5cbb6]">{vehicle.model}</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Specifications Grid */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#68736d] mb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#c96535]" /> Verified Vehicle Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#f8f6f0] border border-[#ede9e1] rounded-sm">
                <span className="text-[10px] font-mono uppercase text-[#68736d] flex items-center gap-1">
                  <Calendar size={12} className="text-[#c96535]" /> Year
                </span>
                <strong className="block text-sm sm:text-base text-[#183c32] mt-1">
                  {vehicle.year ?? 'Verified'}
                </strong>
              </div>

              <div className="p-3 bg-[#f8f6f0] border border-[#ede9e1] rounded-sm">
                <span className="text-[10px] font-mono uppercase text-[#68736d] flex items-center gap-1">
                  <Gauge size={12} className="text-[#c96535]" /> Odometer
                </span>
                <strong className="block text-sm sm:text-base text-[#183c32] mt-1">
                  {formatKm(vehicle.kmsDriven)}
                </strong>
              </div>

              <div className="p-3 bg-[#f8f6f0] border border-[#ede9e1] rounded-sm">
                <span className="text-[10px] font-mono uppercase text-[#68736d] flex items-center gap-1">
                  <Fuel size={12} className="text-[#c96535]" /> Fuel
                </span>
                <strong className="block text-sm sm:text-base text-[#183c32] mt-1">
                  {vehicle.fuelType || 'Petrol'}
                </strong>
              </div>

              <div className="p-3 bg-[#f8f6f0] border border-[#ede9e1] rounded-sm">
                <span className="text-[10px] font-mono uppercase text-[#68736d] flex items-center gap-1">
                  <MapPin size={12} className="text-[#c96535]" /> City
                </span>
                <strong className="block text-sm sm:text-base text-[#183c32] mt-1">
                  {vehicle.city || 'Pan-India'}
                </strong>
              </div>
            </div>
          </div>

          {/* Description & Overview */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#68736d] mb-2">Vehicle Overview</h3>
            <p className="text-sm text-[#48534d] leading-relaxed">
              {vehicle.description ||
                'Inspected according to our rigorous 160-point mechanical, structural, and electronics checklist. Completely accident-free with genuine recorded mileage and authenticated ownership history.'}
            </p>
          </div>

          {/* Apex Assurance Badges */}
          <div className="p-4 bg-[#f0f6f3] border border-[#d2e4dc] rounded-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2 text-xs text-[#1f483b]">
              <ShieldCheck size={18} className="text-[#2a7a5f] shrink-0 mt-0.5" />
              <div>
                <strong>160-Point Certified</strong>
                <p className="text-[11px] text-[#4d7064] mt-0.5">Comprehensive engine, suspension, and brake audit</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-[#1f483b]">
              <Award size={18} className="text-[#2a7a5f] shrink-0 mt-0.5" />
              <div>
                <strong>12-Month Apex Warranty</strong>
                <p className="text-[11px] text-[#4d7064] mt-0.5">Full drivetrain and roadside assistance covered</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-[#1f483b]">
              <Check size={18} className="text-[#2a7a5f] shrink-0 mt-0.5" />
              <div>
                <strong>Non-Accidental Guarantee</strong>
                <p className="text-[11px] text-[#4d7064] mt-0.5">Certified flood-free with original odometer</p>
              </div>
            </div>
          </div>

          {/* Footer Checkout Action */}
          <div className="pt-4 border-t border-[#ede9e1] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#68736d] block">
                Total All-Inclusive Price
              </span>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#183c32]">
                {formatMoney(vehicle.price)}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-3 text-xs font-mono uppercase tracking-wider border border-[#ddd9cf] hover:border-[#183c32] text-[#183c32] rounded-sm transition-colors"
              >
                Close
              </button>

              <button
                disabled={!isAvailable || isPurchasing}
                onClick={() => onPurchase(vehicle)}
                className={`flex-1 sm:flex-none px-6 py-3 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 rounded-sm transition-all ${
                  isAvailable
                    ? 'bg-[#183c32] hover:bg-[#235447] text-white shadow-md'
                    : 'bg-[#cfd3ce] text-[#787f7a] cursor-not-allowed'
                }`}
              >
                <ShoppingBag size={16} />
                <span>{isPurchasing ? 'Processing...' : isAvailable ? 'Reserve & Purchase' : 'Sold Out'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
