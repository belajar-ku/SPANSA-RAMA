import { useState, useEffect } from 'react';
import { SupabaseService } from './SupabaseService';
import { User } from './types';

export const TabLeaderboard = ({ user }: { user: User }) => {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'siswa' | 'kelas'>('siswa');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            if (activeTab === 'siswa') {
                const data = await SupabaseService.getLeaderboard(user.gender || 'L');
                setList(data);
            } else {
                const data = await SupabaseService.getClassLeaderboard();
                setList(data);
            }
            setLoading(false);
        };
        load();
    }, [user.gender, activeTab]);

    return (
        <div className="p-6 pb-28 animate-slide-up">
            <div className="glass-card bg-gradient-to-r from-yellow-400 to-orange-500 rounded-[24px] p-6 text-white mb-6 shadow-xl text-center relative overflow-hidden">
                <i className="fas fa-trophy text-5xl mb-2 opacity-80 animate-bounce"></i>
                <h2 className="text-2xl font-black">Papan Juara</h2>
                <p className="text-xs font-bold opacity-90">{activeTab === 'siswa' ? (user.gender === 'L' ? 'Siswa Putra Terbaik' : 'Siswa Putri Terbaik') : 'Kelas Paling Aktif'}</p>
            </div>

            <div className="flex bg-white p-1 rounded-2xl mb-6 shadow-sm border border-slate-100">
                <button onClick={() => setActiveTab('siswa')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'siswa' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Siswa</button>
                <button onClick={() => setActiveTab('kelas')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'kelas' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Kelas</button>
            </div>

            <div className="space-y-3">
                {loading ? <div className="text-center p-10"><i className="fas fa-circle-notch fa-spin text-slate-400"></i></div> : (
                    list.map((item, index) => (
                        <div key={item.id} className={`glass-card p-4 rounded-2xl flex items-center gap-4 border ${index === 0 ? 'border-yellow-400 bg-yellow-50' : (index === 1 ? 'border-slate-300 bg-slate-50' : (index === 2 ? 'border-orange-300 bg-orange-50' : 'border-slate-100 bg-white'))}`}>
                            <div className={`w-8 h-8 flex items-center justify-center font-black text-lg ${index < 3 ? 'text-slate-800' : 'text-slate-400'}`}>
                                #{index + 1}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{activeTab === 'siswa' ? `Kelas ${item.kelas || '-'}` : 'Akumulasi Poin'}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-black text-primary-600">{item.points}</span>
                                <span className="text-[8px] block font-bold text-slate-400">POIN</span>
                            </div>
                        </div>
                    ))
                )}
                {!loading && list.length === 0 && <div className="text-center text-slate-400 p-6">Belum ada data.</div>}
            </div>
        </div>
    );
};