import React from 'react';
import { Car, LogOut, ShieldCheck, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { Session } from '../types';

interface NavbarProps {
  session: Session;
  onLogout: () => void;
  adminOpen: boolean;
  onToggleAdmin: () => void;
  onOpenPurchases: () => void;
  purchaseCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  onLogout,
  adminOpen,
  onToggleAdmin,
  onOpenPurchases,
  purchaseCount
}) => {
  const isAdmin = session.user.role === 'admin';

  return (
    <nav>
      <div className="logo cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <Car className="brand-icon" size={24} />
        <span>
          APEX <i>MOTORS</i>
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={onOpenPurchases}
          className="flex items-center gap-2 px-3 py-2 text-xs font-mono tracking-wider uppercase text-[#173f34] hover:text-[#c96535] transition-colors rounded hover:bg-[#eae7df]"
          title="View my purchase history"
        >
          <ShoppingBag size={16} />
          <span className="hidden sm:inline">My Purchases</span>
          {purchaseCount > 0 && (
            <span className="bg-[#183c32] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {purchaseCount}
            </span>
          )}
        </button>

        {isAdmin && (
          <button
            onClick={onToggleAdmin}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono tracking-wider uppercase rounded transition-all ${
              adminOpen
                ? 'bg-[#183c32] text-white shadow-sm'
                : 'bg-[#c96535] text-white hover:bg-[#b05327] shadow-sm'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span className="font-semibold">{adminOpen ? 'Showroom Mode' : 'Admin Manager'}</span>
          </button>
        )}

        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-[#d9d8d1]">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-[#183c32] flex items-center justify-end gap-1">
              {session.user.name}
              {isAdmin && (
                <span title="Verified Administrator">
                  <ShieldCheck size={14} className="text-[#c96535]" />
                </span>
              )}
            </span>
            <span className="text-[10px] font-mono text-[#68736d] uppercase tracking-wider">
              {isAdmin ? 'Dealership Admin' : 'Customer Account'}
            </span>
          </div>

          <button
            className="p-2 text-[#173f34] hover:text-[#c96535] transition-colors rounded-full hover:bg-[#eae7df]"
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};
