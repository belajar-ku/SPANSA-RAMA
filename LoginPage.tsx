import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { User, APP_LOGO_URL } from './types';

export const LoginPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [tab, setTab] = useState<'nisn' | 'staff'>('nisn');
  const [val, setVal] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!val || !password) {
        Swal.fire('Eits!', 'Username dan Password harus diisi ya.', 'warning');
        return;
    }

    setLoading(true);
    
    // Attempt Login
    const result = await SupabaseService.login(val, password, tab);
    setLoading(false);
    
    if (result.success && result.user) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        Toast.fire({
            icon: 'success',
            title: `Selamat datang, ${result.user.name}`
        });
        onLogin(result.user);
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Gagal Masuk',
            text: result.error,
            confirmButtonText: 'Coba Lagi',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-[32px]' }
        });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-100">
       <div className="fixed inset-0 z-0 bg-blob opacity-60"></div>
       <div className="w-full max-w-sm glass-card rounded-[48px] p-2 animate-slide-up relative z-10 shadow-2xl">
          <div className="bg-white/60 backdrop-blur-xl rounded-[40px] p-8 pt-10 border border-white/80 shadow-inner">
             
             {/* Header */}
             <div className="text-center mb-8">
                <div className="w-24 h-24 bg-white rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/50 p-3">
                   <img src={APP_LOGO_URL} className="w-full h-full object-contain" alt="Logo" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">SPANSA RAMA</h1>
                <p className="text-slate-500 text-[10px] font-bold tracking-[0.3em] uppercase">UPT SMPN 1 PASURUAN</p>
             </div>

             {/* Tab Switcher */}
             <div className="bg-slate-200/60 p-1.5 rounded-[24px] flex mb-8 relative">
                <button 
                  onClick={() => setTab('nisn')} 
                  className={`relative z-10 flex-1 py-3 text-[10px] font-black tracking-wider rounded-[20px] transition-all duration-300 ${tab === 'nisn' ? 'bg-white text-primary-600 shadow-lg scale-100' : 'text-slate-500 hover:text-slate-600'}`}
                >
                  <i className="fas fa-user-graduate mr-1"></i> SISWA
                </button>
                <button 
                  onClick={() => setTab('staff')} 
                  className={`relative z-10 flex-1 py-3 text-[10px] font-black tracking-wider rounded-[20px] transition-all duration-300 ${tab === 'staff' ? 'bg-white text-primary-600 shadow-lg scale-100' : 'text-slate-500 hover:text-slate-600'}`}
                >
                   <i className="fas fa-chalkboard-teacher mr-1"></i> GURU/ADMIN
                </button>
             </div>

             {/* Form */}
             <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                   <div className="relative">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                          {tab === 'nisn' ? 'NISN Siswa' : 'Username'}
                       </label>
                       <input 
                             type="text"
                             autoCapitalize="none"
                             className="w-full pl-6 pr-6 py-4 bg-white border border-transparent focus:border-primary-300 rounded-[24px] text-slate-800 font-bold outline-none shadow-sm transition-all placeholder:text-slate-300 text-sm"
                             placeholder={tab === 'nisn' ? 'Contoh: 0012345678' : 'Contoh: admin'}
                             value={val}
                             onChange={e => setVal(e.target.value)}
                          />
                   </div>

                   <div className="relative">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-4 mb-1 block">
                          Password
                       </label>
                       <div className="relative">
                           <input 
                              type={showPassword ? "text" : "password"}
                              className="w-full pl-6 pr-12 py-4 bg-white border border-transparent focus:border-primary-300 rounded-[24px] text-slate-800 font-bold outline-none shadow-sm transition-all placeholder:text-slate-300 text-sm"
                              placeholder={tab === 'nisn' ? 'NISN' : 'Password'}
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                           />
                           <button 
                             type="button"
                             onClick={() => setShowPassword(!showPassword)}
                             className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2"
                           >
                               <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                           </button>
                       </div>
                   </div>
                </div>

                <button disabled={loading} className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-black text-sm rounded-[24px] shadow-lg shadow-primary-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4">
                   {loading ? <i className="fas fa-circle-notch fa-spin"></i> : (
                       <>
                        <span>MASUK SEKARANG</span>
                        <i className="fas fa-arrow-right"></i>
                       </>
                   )}
                </button>
             </form>
          </div>
       </div>
       <p className="fixed bottom-4 text-[10px] font-bold text-slate-400 opacity-50">v2.1 • Spansa Rama</p>
    </div>
  );
};