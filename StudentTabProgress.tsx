import { useState, useEffect } from 'react';
import { SupabaseService } from './SupabaseService';
import { User, getWIBDate } from './types';

export const TabProgress = ({ user, onEdit }: { user: User, onEdit: (date: string, type: 'harian' | 'literasi') => void }) => {
    const [recap, setRecap] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalPoints: 0, daysActive: 0 });
    const [loading, setLoading] = useState(true);
    const [subTab, setSubTab] = useState<'ibadah' | 'literasi'>('ibadah');

    useEffect(() => {
        const load = async () => {
            const data = await SupabaseService.getStudentRecap(user.id);
            // Sort by date descending (newest first)
            const sortedData = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecap(sortedData);

            const totalPoints = data.reduce((acc, curr) => acc + (curr.total_points || 0), 0);
            const daysActive = data.length;
            
            setStats({ totalPoints, daysActive });
            setLoading(false);
        };
        load();
    }, [user.id]);

    if(loading) return <div className="p-10 text-center"><i className="fas fa-circle-notch fa-spin text-primary-500 text-2xl"></i></div>;

    return (
        <div className="p-6 pb-28 animate-slide-up font-sans">
            {/* Header Card UI */}
            <div className="bg-gradient-to-r from-sky-400 to-blue-600 rounded-[30px] p-8 text-white mb-6 shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10" 
                     style={{backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2.5px)', backgroundSize: '20px 20px'}}></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black mb-1">Progress Ibadah</h2>
                    <p className="text-sm font-medium text-blue-100">Pantau konsistensi ibadah & literasimu</p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-200 p-1 rounded-2xl mb-6 shadow-inner">
                <button 
                    onClick={() => setSubTab('ibadah')} 
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${subTab === 'ibadah' ? 'bg-white text-sky-600 shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-600'}`}
                >
                    Skor Ibadah
                </button>
                <button 
                    onClick={() => setSubTab('literasi')} 
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${subTab === 'literasi' ? 'bg-white text-blue-600 shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-600'}`}
                >
                    Status Literasi
                </button>
            </div>

            {/* List Content */}
            <div className="space-y-4">
                {recap.map((log, idx) => {
                    const isIbadah = subTab === 'ibadah';
                    const maxPoints = 150; // Asumsi max poin per hari
                    const percentage = Math.min(100, (log.total_points / maxPoints) * 100);
                    
                    // Literasi check
                    const hasLiterasi = log.details?.literasiResponse && log.details.literasiResponse.length > 0 && log.details.literasiResponse[0] !== "";
                    
                    return (
                        <div key={log.date} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                            {/* Number Circle */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0 shadow-md ${isIbadah ? 'bg-slate-800' : 'bg-blue-600'}`}>
                                {recap.length - idx}
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-wider">{log.date}</span>
                                    {isIbadah && <span className="text-xs font-black text-slate-800">{log.total_points}</span>}
                                </div>
                                
                                <h4 className="font-bold text-slate-700 text-sm mb-2">
                                    {isIbadah ? 'Poin Harian' : 'Tugas Literasi'}
                                </h4>

                                {isIbadah ? (
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                                            style={{width: `${percentage}%`}}
                                        ></div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-full rounded-full overflow-hidden ${hasLiterasi ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                            <div className={`h-full rounded-full ${hasLiterasi ? 'w-full bg-blue-500' : 'w-0'}`}></div>
                                        </div>
                                        <span className={`text-[10px] font-bold ${hasLiterasi ? 'text-blue-500' : 'text-slate-400'}`}>
                                            {hasLiterasi ? 'Selesai' : 'Belum'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <button 
                                onClick={() => onEdit(log.date, isIbadah ? 'harian' : 'literasi')}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase transition-colors shrink-0"
                            >
                                Edit
                            </button>
                        </div>
                    );
                })}

                {recap.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i className="fas fa-inbox text-slate-400 text-xl"></i>
                        </div>
                        <p className="text-slate-400 text-sm font-bold">Belum ada riwayat laporan.</p>
                    </div>
                )}
            </div>
        </div>
    );
};