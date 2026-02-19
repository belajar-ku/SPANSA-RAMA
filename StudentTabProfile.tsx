import { User } from './types';

export const TabProfile = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
    return (
        <div className="p-6 pb-28 animate-slide-up">
             <div className="glass-card p-6 rounded-[32px] text-center mb-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary-50 to-transparent"></div>
                 <div className="w-24 h-24 bg-white border-4 border-white shadow-xl text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-black relative z-10">
                     {user.name.charAt(0)}
                 </div>
                 <h2 className="text-xl font-black text-slate-800 relative z-10">{user.name}</h2>
                 <p className="text-sm text-slate-500 font-bold relative z-10 mb-1">{user.role === 'murid' ? `Kelas ${user.kelas || '-'}` : user.role.toUpperCase()}</p>
                 <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-400 relative z-10">
                    {user.username}
                 </div>
             </div>

             <div className="space-y-3">
                 <button onClick={onLogout} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-[24px] border border-red-100 shadow-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                     <i className="fas fa-sign-out-alt"></i> Keluar Aplikasi
                 </button>
                 <div className="text-center mt-8">
                     <p className="text-[10px] text-slate-400">Aplikasi Ramadan Digital Spansa</p>
                     <p className="text-[10px] text-slate-300">Created with ❤️ by Tim IT</p>
                 </div>
             </div>
        </div>
    );
};