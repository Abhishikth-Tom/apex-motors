import React, { useEffect } from 'react';
import { X, CheckCircle, Calendar, Tag, MapPin, ShoppingBag } from 'lucide-react';
import { PurchaseRecord } from '../types';

interface PurchaseHistoryModalProps {
  purchases: PurchaseRecord[];
  onClose: () => void;
  loading: boolean;
}

export const PurchaseHistoryModal: React.FC<PurchaseHistoryModalProps> = ({
  purchases,
  onClose,
  loading
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(n);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0e221d]/80 backdrop-blur-sm modal-backdrop"
      onClick={onClose}
      data-testid="purchase-history-modal"
    >
      <div
        className="bg-white max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-sm border border-[#ddd9cf] shadow-2xl relative modal-content flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-[#183c32] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-sm">
              <ShoppingBag size={20} className="text-[#c96535]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c96535] block">
                Order Records
              </span>
              <h2 className="font-serif text-2xl font-bold">My Purchased Vehicles</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close purchase history"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-[#68736d]">Loading purchase history...</div>
          ) : purchases.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-[#f5f3ee] text-[#183c32] rounded-full flex items-center justify-center">
                <ShoppingBag size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#183c32]">No purchases recorded yet</h3>
              <p className="text-xs text-[#68736d] max-w-sm mx-auto">
                Explore our curated showroom catalogue, inspect vehicle specifications, and reserve your certified automobile.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-[#183c32] text-white text-xs font-mono uppercase tracking-wider rounded-sm hover:bg-[#235447] transition-colors"
              >
                Explore Showroom
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#ede9e1]">
              {purchases.map((p) => (
                <div key={p.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <CheckCircle size={11} /> Confirmed Order
                      </span>
                      <span className="text-[10px] font-mono text-[#8a948e]">Ref: {p.id.slice(0, 8)}</span>
                    </div>

                    <h4 className="font-serif text-lg font-bold text-[#183c32]">
                      {p.make} <span className="font-normal italic">{p.model}</span>
                    </h4>

                    <div className="flex items-center gap-4 text-xs font-mono text-[#68736d] mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-[#c96535]" />
                        {formatDate(p.purchased_at)}
                      </span>
                      {p.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-[#c96535]" />
                          {p.city}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] font-mono uppercase text-[#8a948e] block">Settled Amount</span>
                    <strong className="text-lg font-bold text-[#183c32] font-mono">{formatMoney(p.price)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-[#f9f8f5] border-t border-[#ede9e1] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-mono uppercase tracking-wider border border-[#ddd9cf] hover:border-[#183c32] text-[#183c32] rounded-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
