import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulasi proses login
    setTimeout(() => {
      const u = import.meta.env.VITE_ADMIN_USERNAME;
      const p = import.meta.env.VITE_ADMIN_PASSWORD;

      if (username === u && password === p) {
        localStorage.setItem('admin_logged_in', 'true');
        navigate('/admin');
      } else {
        setError('Username atau password salah');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 sm:p-12">
          <div className="flex flex-col items-center text-center mb-10">
            <img src="/logo.svg" alt="Logo" className="w-16 h-16 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
            <p className="text-slate-500 mt-1">Masuk untuk kelola data pengajuan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                placeholder="Masukkan username"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                placeholder="Masukkan password"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 p-6 text-center border-t">
          <p className="text-xs text-slate-400">© 2026 Sistem Pengajuan Mitra Bisnis. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}
