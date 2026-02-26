import { useState, useEffect } from 'react';
import { SupabaseService } from './SupabaseService';
import { User, getWIBDate } from './types';

export const TabProgress = ({ user, onEdit }: { user: User, onEdit: (date: string, type: 'harian' | 'literasi') => void }) => {
    const [recap, setRecap] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [subTab, setSubTab] = useState<'ibadah' | 'literasi' | 'rekap'>('ibadah');
    const [startDate] = useState('2026-02-18');
    const [endDate] = useState(getWIBDate());

    useEffect(() => {
        const load = async () => {
            const data = await SupabaseService.getStudentRecap(user.id);
            // Filter dates >= 2026-02-18
            const filteredData = data.filter(d => d.date >= '2026-02-18');
            // Sort by date descending (newest first)
            const sortedData = filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecap(sortedData);
            setLoading(false);
        };
        load();
    }, [user.id]);

    // Helper to get dates in range
    const getDatesInRange = (start: string, end: string) => {
        const dateArray = [];
        let currentDate = new Date(start);
        const stopDate = new Date(end);
        while (currentDate <= stopDate) {
            dateArray.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dateArray;
    };

    const dateString = (d: Date) => d.toISOString().split('T')[0];
    const todayStr = getWIBDate();

    const filteredDates = getDatesInRange(startDate, endDate);

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
            <div className="flex bg-slate-200 p-1 rounded-2xl mb-6 shadow-inner overflow-x-auto">
                <button 
                    onClick={() => setSubTab('ibadah')} 
                    className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap ${subTab === 'ibadah' ? 'bg-white text-sky-600 shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-600'}`}
                >
                    Skor Ibadah
                </button>
                <button 
                    onClick={() => setSubTab('literasi')} 
                    className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap ${subTab === 'literasi' ? 'bg-white text-blue-600 shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-600'}`}
                >
                    Status Literasi
                </button>
                <button 
                    onClick={() => setSubTab('rekap')} 
                    className={`flex-1 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap ${subTab === 'rekap' ? 'bg-white text-indigo-600 shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-600'}`}
                >
                    Rekapitulasi
                </button>
            </div>

            {/* List Content */}
            <div className="space-y-4">
                {subTab === 'rekap' ? (
                    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                        {/* Summary Card for Rerata Poin */}
                        <div className="bg-indigo-50 rounded-xl p-4 mb-4 flex items-center justify-between border border-indigo-100">
                            <div>
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Rerata Poin</p>
                                <p className="text-[10px] text-indigo-300">Total Poin / Hari (sejak 18 Feb)</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-indigo-600">
                                    {(() => {
                                        const startCalculationDate = new Date('2026-02-18');
                                        const todayDate = new Date(getWIBDate());
                                        startCalculationDate.setHours(0,0,0,0);
                                        todayDate.setHours(0,0,0,0);
                                        
                                        const diffTime = Math.max(0, todayDate.getTime() - startCalculationDate.getTime());
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                        
                                        // Note: recap only contains logs that exist. 
                                        // Ideally we should sum points from logs within the date range if we want strictness, 
                                        // but usually all logs are valid.
                                        // However, we should only count points >= 2026-02-18.
                                        const validPoints = recap.filter(r => r.date >= '2026-02-18').reduce((sum, r) => sum + (r.total_points || 0), 0);
                                        
                                        return (validPoints / diffDays).toFixed(1);
                                    })()}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-700">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-3 font-bold rounded-tl-xl">Tanggal</th>
                                        <th className="px-3 py-3 font-bold text-center">Harian</th>
                                        <th className="px-3 py-3 font-bold text-center">Literasi</th>
                                        <th className="px-3 py-3 font-bold text-center rounded-tr-xl">Poin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDates.map((date) => {
                                        const dStr = dateString(date);
                                        const log = recap.find(r => r.date === dStr);
                                        const hasLog = !!log;
                                        
                                        // Check details for specific status if needed, or just rely on log existence + fields
                                        // Using logic similar to AdminTabs
                                        const d = log?.details || {};
                                        const harianDone = hasLog && !!(d.puasaStatus || d.sholatStatus || d.bukaStatus || d.sahurStatus);
                                        const literasiDone = hasLog && (d.literasiResponse && d.literasiResponse.length > 0 && d.literasiResponse.some((a: string) => a.trim() !== ''));
                                        
                                        const isPast = dStr < todayStr;
                                        const isToday = dStr === todayStr;

                                        const points = log?.total_points || 0;

                                        return (
                                            <tr key={dStr} className={`hover:bg-slate-50 ${isToday ? 'bg-blue-50' : ''}`}>
                                                <td className="px-3 py-3 font-medium whitespace-nowrap">
                                                    {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    {isToday && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Hari Ini</span>}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    {hasLog ? (
                                                        harianDone ? <i className="fas fa-check-circle text-emerald-500 text-lg"></i> : <i className="fas fa-times-circle text-red-300 text-lg"></i>
                                                    ) : (isPast ? <i className="fas fa-times-circle text-red-300 text-lg"></i> : <span className="text-slate-300">-</span>)}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    {hasLog ? (
                                                        literasiDone ? <i className="fas fa-check-circle text-blue-500 text-lg"></i> : <i className="fas fa-times-circle text-red-300 text-lg"></i>
                                                    ) : (isPast ? <i className="fas fa-times-circle text-red-300 text-lg"></i> : <span className="text-slate-300">-</span>)}
                                                </td>
                                                <td className="px-3 py-3 text-center font-bold text-slate-700">
                                                    {hasLog ? points : (isPast ? 0 : '-')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    recap.map((log, idx) => {
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
                    })
                )}

                {subTab !== 'rekap' && recap.length === 0 && (
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