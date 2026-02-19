import { useState, useEffect } from 'react';
import { SupabaseService } from './SupabaseService';
import { getWIBDate } from './types';

export const TabMateri = () => {
    const [prayerTimes, setPrayerTimes] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showQuran, setShowQuran] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [quranFullscreen, setQuranFullscreen] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    
    const date = getWIBDate();

    // Scroll Listener for Back to Top Button
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > window.innerHeight) {
                setShowScrollBtn(true);
            } else {
                setShowScrollBtn(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    useEffect(() => {
        const fetchP = async () => {
            setLoading(true);
            const times = await SupabaseService.getPrayerSchedule(date);
            setPrayerTimes(times);
            setLoading(false);
        };
        fetchP();
    }, [date]);

    return (
        <div className="p-6 pb-28 animate-slide-up relative">
            {/* Jadwal Sholat Widget */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl shadow-lg p-6 mb-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-extrabold mb-1">Jadwal Sholat</h2>
                            <p className="text-emerald-200 text-xs flex items-center gap-1">
                                <i className="fas fa-map-marker-alt"></i> <span>Kota Pasuruan</span>
                            </p>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-100 bg-white/10 px-2 py-1 rounded">{date}</div>
                    </div>
                    
                    {loading ? <div className="text-center text-xs opacity-70">Memuat...</div> : prayerTimes ? (
                        <div className="grid grid-cols-5 gap-2 text-center" id="prayer-times-container">
                            <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-[10px] text-emerald-200">Subuh</div>
                                <div className="font-bold text-sm">{prayerTimes.Fajr}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-[10px] text-emerald-200">Dzuhur</div>
                                <div className="font-bold text-sm">{prayerTimes.Dhuhr}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-[10px] text-emerald-200">Ashar</div>
                                <div className="font-bold text-sm">{prayerTimes.Asr}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-[10px] text-emerald-200">Maghrib</div>
                                <div className="font-bold text-sm">{prayerTimes.Maghrib}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-2">
                                <div className="text-[10px] text-emerald-200">Isya</div>
                                <div className="font-bold text-sm">{prayerTimes.Isha}</div>
                            </div>
                        </div>
                    ) : <div className="text-center text-xs text-red-200">Gagal memuat</div>}
                </div>
            </div>

            {/* Quran Digital Reader */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 border border-slate-100">
                <div 
                    className="bg-teal-50 p-4 border-b border-teal-100 flex items-center justify-between cursor-pointer"
                    onClick={() => setShowQuran(!showQuran)}
                >
                    <div className="flex items-center gap-3">
                        <i className="fas fa-quran text-teal-600 text-xl"></i>
                        <div>
                            <h3 className="font-bold text-teal-800 leading-tight">AL-QURAN DIGITAL</h3>
                            <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Baca & Terjemahan Indonesia</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={(e) => { e.stopPropagation(); setQuranFullscreen(true); }}
                            className="bg-teal-100 hover:bg-teal-200 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center transition text-xs"
                         >
                            <i className="fas fa-expand"></i>
                         </button>
                         <i className={`fas fa-chevron-down text-teal-500 transition-transform ${showQuran ? 'rotate-180' : ''}`}></i>
                    </div>
                </div>
                {showQuran && (
                    <div className="animate-slide-up">
                        <iframe src="https://quranweb.id" loading="lazy" className="w-full border-none h-[70vh]" title="Al-Quran Digital"></iframe>
                    </div>
                )}
            </div>

            {/* Fullscreen Quran Modal */}
            {quranFullscreen && (
                <div className="fixed inset-0 z-[120] bg-white flex flex-col animate-slide-up">
                    <div className="bg-teal-700 text-white p-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-quran"></i>
                            <span className="font-bold text-sm">Al-Quran Digital</span>
                        </div>
                        <button onClick={() => setQuranFullscreen(false)} className="bg-white/20 hover:bg-white/30 w-8 h-8 rounded-full flex items-center justify-center transition">
                            <i className="fas fa-times text-sm"></i>
                        </button>
                    </div>
                    <iframe src="https://quranweb.id" loading="lazy" className="w-full flex-1 border-none" title="Al-Quran Digital Fullscreen"></iframe>
                </div>
            )}

            {/* Fiqih Content */}
            <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                    <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-3">
                        <i className="fas fa-book-open text-emerald-600 text-xl"></i>
                        <div>
                            <h3 className="font-bold text-emerald-800 leading-tight">FIQIH PUASA, ZAKAT & DOA</h3>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Materi Wajib Baca</p>
                        </div>
                    </div>
                    <div className="p-4 text-sm text-gray-700 leading-relaxed space-y-4">
                        {/* Accordion Items */}
                        {[
                            { id: 'dalil', title: 'A. Perintah & Dalil Puasa', content: (
                                <>
                                    <p className="mb-2">Puasa Ramadhan adalah rukun Islam ke-4. Hukumnya <strong>Wajib 'Ain</strong> bagi setiap muslim yang memenuhi syarat.</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li><strong>QS. Al-Baqarah: 183</strong>: "Hai orang-orang yang beriman, diwajibkan atas kamu berpuasa..."</li>
                                        <li><strong>Hadits</strong>: "Barangsiapa berpuasa Ramadhan atas dasar iman dan mengharap pahala dari Allah, maka dosanya yang telah lalu akan diampuni." (HR. Bukhari & Muslim).</li>
                                    </ul>
                                </>
                            )},
                            { id: 'syarat', title: 'B. Syarat & Rukun Puasa', content: (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead>
                                            <tr className="bg-emerald-50 text-emerald-800">
                                                <th className="p-2 border border-emerald-100">Syarat Wajib</th>
                                                <th className="p-2 border border-emerald-100">Syarat Sah</th>
                                                <th className="p-2 border border-emerald-100">Rukun</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="p-2 border border-gray-100 align-top">1. Islam<br/>2. Baligh<br/>3. Berakal<br/>4. Mampu</td>
                                                <td className="p-2 border border-gray-100 align-top">1. Islam<br/>2. Mumayyiz<br/>3. Suci Haid<br/>4. Waktu sah</td>
                                                <td className="p-2 border border-gray-100 align-top">1. <strong>Niat</strong><br/>2. <strong>Imsak</strong> (Menahan diri)</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )},
                            { id: 'batal', title: 'C. Hal Membatalkan Puasa', content: (
                                <>
                                    <p className="text-red-500 text-xs font-bold mb-2">Wajib diganti (Qadha) jika melakukan:</p>
                                    <ol className="list-decimal pl-4 space-y-1">
                                        <li>Makan & minum sengaja.</li>
                                        <li>Muntah disengaja.</li>
                                        <li>Haid atau Nifas.</li>
                                        <li>Hilang Akal (Gila/Pingsan seharian).</li>
                                        <li>Murtad (Keluar Islam).</li>
                                    </ol>
                                </>
                            )},
                            { id: 'zakat', title: 'D. Panduan Niat Zakat Fitrah', content: (
                                <div className="space-y-3">
                                    <div className="p-2 bg-yellow-50 rounded border border-yellow-100 text-xs">Besaran: 2,5 kg atau 3,5 liter beras.</div>
                                    <div><p className="font-bold text-emerald-700 text-xs mb-1">1. Diri Sendiri</p><p className="italic text-gray-600">"Nawaitu an ukhrija zakatal fithri 'an nafsi fardhan lillahi ta'ala."</p></div>
                                    <div><p className="font-bold text-emerald-700 text-xs mb-1">2. Keluarga</p><p className="italic text-gray-600">"Nawaitu an ukhrija zakatal fithri 'anni wa 'an jami'i ma yalzamunii nafaqatuhum syar'an fardhan lillahi ta'ala."</p></div>
                                </div>
                            )},
                            { id: 'doa', title: 'E. Himpunan Doa Penting', content: (
                                <div className="space-y-4">
                                    <div><p className="font-bold text-emerald-700 text-xs mb-1">🤲 Niat Puasa</p><p className="italic text-gray-600">"Nawaitu shauma ghadin 'an ada'i fardhi syahri Ramadhana hadzihis sanati lillahi ta'ala."</p></div>
                                    <div><p className="font-bold text-emerald-700 text-xs mb-1">🤲 Doa Berbuka</p><p className="italic text-gray-600">"Allahumma laka shumtu wa bika amantu wa 'ala rizqika afthartu birahmatika yaa arhamar rahimin."</p></div>
                                </div>
                            )}
                        ].map((item) => (
                            <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden">
                                <button 
                                    onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)}
                                    className="w-full flex justify-between items-center font-bold bg-gray-50 p-3 hover:bg-gray-100 transition text-left"
                                >
                                    <span>{item.title}</span>
                                    <span className={`text-emerald-500 transition-transform ${activeAccordion === item.id ? 'rotate-180' : ''}`}><i className="fas fa-chevron-down"></i></span>
                                </button>
                                {activeAccordion === item.id && (
                                    <div className="p-4 bg-white border-t border-gray-100 animate-slide-up">
                                        {item.content}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Back to Top Button */}
            {showScrollBtn && (
                <button 
                    onClick={scrollToTop}
                    className="fixed bottom-24 right-6 w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center animate-slide-up z-40 hover:bg-primary-700 transition"
                >
                    <i className="fas fa-arrow-up"></i>
                </button>
            )}
        </div>
    );
};