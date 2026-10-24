import React, { useState } from 'react';
import { Car, Sparkles, Shield, ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react';
import { Session } from '../types';

interface AuthViewProps {
  onAuthenticated: (session: Session) => void;
  apiBase: string;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated, apiBase }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message || 'Authentication failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('apex-session', JSON.stringify(data));
      onAuthenticated(data);
    } catch {
      setErrorMessage('Could not connect to dealership backend service.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email: string, pass: string) => {
    setForm({ name: 'Demo User', email, password: pass });
    setIsRegister(false);
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message || 'Demo sign-in failed');
        setLoading(false);
        return;
      }
      localStorage.setItem('apex-session', JSON.stringify(data));
      onAuthenticated(data);
    } catch {
      setErrorMessage('Could not connect to dealership backend service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      {/* Editorial Hero Branding */}
      <section className="hero">
        <span className="eyebrow">
          <Sparkles size={16} /> CERTIFIED INVENTORY
        </span>
        <h1>Find the car that moves your story forward.</h1>
        <p>
          Real physical inventory, genuine certified service histories, transparent on-road pricing, and strict
          atomic transactions that prevent overselling.
        </p>

        <div className="stats">
          <div>
            <b>160+</b>
            <span>Multi-Point Checklist</span>
          </div>
          <div>
            <b>100%</b>
            <span>Stock Safety Lock</span>
          </div>
          <div>
            <b>1-Year</b>
            <span>Comprehensive Warranty</span>
          </div>
        </div>
      </section>

      {/* Auth Card Panel */}
      <section className="auth-card">
        <div className="flex items-center gap-2 mb-2">
          <Car className="brand" />
          <span className="font-mono text-xs tracking-widest uppercase text-[#183c32] font-bold">
            Apex Motors Showroom
          </span>
        </div>

        <h2>{isRegister ? 'Create Client Account' : 'Welcome to the Showroom'}</h2>

        {errorMessage && (
          <div className="p-3 mb-4 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              Full Name
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="e.g. Mira Nair"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </label>
          )}

          <label>
            Email Address
            <input
              required
              type="email"
              placeholder="e.g. client@apexmotors.test"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>

          <label>
            Password (min 8 characters)
            <input
              required
              type="password"
              minLength={8}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Enter Showroom'}
            <ArrowRight size={16} />
          </button>
        </form>

        <button
          type="button"
          className="link mt-4 text-left"
          onClick={() => {
            setIsRegister(!isRegister);
            setErrorMessage('');
          }}
        >
          {isRegister ? 'Already registered? Sign in instead' : "Don't have an account? Register as client"}
        </button>

        {/* Quick Demo Pre-fill Shortcuts */}
        <div className="mt-8 pt-6 border-t border-[#ddd9cf]/70 text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#68736d] block mb-2">
            Instant Demo Sign-in
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@apexmotors.test', 'Admin123!')}
              className="flex-1 p-2 text-left bg-white border border-[#ddd9cf] hover:border-[#183c32] rounded-sm transition-colors"
            >
              <div className="font-semibold text-[#183c32] flex items-center gap-1">
                <Shield size={12} className="text-[#c96535]" /> Administrator
              </div>
              <div className="text-[10px] font-mono text-[#68736d]">admin@apexmotors.test</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('customer@apexmotors.test', 'Customer123!')}
              className="flex-1 p-2 text-left bg-white border border-[#ddd9cf] hover:border-[#183c32] rounded-sm transition-colors"
            >
              <div className="font-semibold text-[#183c32]">Demo Customer</div>
              <div className="text-[10px] font-mono text-[#68736d]">customer@apexmotors.test</div>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
