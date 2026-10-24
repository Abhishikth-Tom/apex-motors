import React from 'react';
import { Sparkles, Shield, Award, CheckCircle } from 'lucide-react';
import { InventoryHealth } from '../types';

interface ShowroomHeroProps {
  isAdmin: boolean;
  health: InventoryHealth | null;
}

export const ShowroomHero: React.FC<ShowroomHeroProps> = ({ isAdmin, health }) => {
  const formatMoney = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(n);

  return (
    <>
      <header className="hero-header">
        <div className="max-w-[1240px] mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <span className="eyebrow">
              <Sparkles size={14} /> INVENTORY WITH INTEGRITY
            </span>
            <div className="flex items-center gap-4 text-xs font-mono text-[#cddbd4]">
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <Shield size={14} className="text-[#c96535]" /> 160-Point Inspection
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <Award size={14} className="text-[#c96535]" /> 1-Year Apex Warranty
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <CheckCircle size={14} /> Real-Time Live Stock
              </span>
            </div>
          </div>

          <h1>
            Drive something <em>remarkable.</em>
          </h1>
          <p className="max-w-2xl text-[#d4ded9] text-sm sm:text-base leading-relaxed mt-2">
            Discover verified premium pre-owned automobiles. Transparent pricing, complete service histories,
            and immediate digital reservation with concurrency-protected checkout.
          </p>
        </div>
      </header>

      {/* Internal Warehouse & Financial Health: ADMIN ONLY */}
      {isAdmin && health && (
        <section className="health-dashboard" aria-label="Administrator inventory health metrics">
          <div className="health-stat">
            <small>Active Models</small>
            <b>{health.models}</b>
          </div>
          <div className="health-stat">
            <small>Physical Units</small>
            <b>{health.units} units</b>
          </div>
          <div className="health-stat">
            <small>Low Stock Alert</small>
            <b className={health.lowStock > 0 ? 'text-amber-700' : ''}>{health.lowStock} models</b>
          </div>
          <div className="health-stat">
            <small>Sold Out Models</small>
            <b className={health.soldOut > 0 ? 'text-rose-700' : ''}>{health.soldOut} models</b>
          </div>
          <div className="health-stat">
            <small>Total Inventory Value</small>
            <b className="text-[#183c32]">{formatMoney(health.value)}</b>
          </div>
        </section>
      )}
    </>
  );
};
