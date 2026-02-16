import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { User, LiterasiConfig, DailyLog, DailyLogDetails, RAMADAN_QUOTES } from './types';

const getTodayDate = () => new Date().toISOString().split('T')[0];

// --- Tab Harian ---
export const TabHarian = ({ user }: { user: User }) => {
  const [submitted, setSubmitted] = useState(false);
  
  // State for Form logic
  const [puasaStatus, setPuasaStatus] = useState<'Penuh' | 'Setengah' | 'Tidak'>('Penuh');
  const [alasanTidakPuasa, setAlasanTidakPuasa] = useState('Sakit');
  const [isHaid, setIsHaid] = useState(false);

  const [sahurStatus, setSahurStatus] = useState('Ya');
  const [sahurLokasi, setSahurLokasi] = useState('Sahur Bersama Keluarga');
  const [sahurWaktu, setSahurWaktu] = useState('1 Jam sebelum Imsak');
  const [bukaStatus, setBukaStatus] = useState('Segera setelah Azan Maghrib');

  const [sholatStatus, setSholatStatus] = useState<Record<string, string>>({
    'Subuh': 'Lewat', 'Zuhur': 'Lewat', 'Asar': 'Lewat', 'Magrib': 'Lewat', 'Isya': 'Lewat'
  });

  const [sunahStatus, setSunahStatus] = useState<Record<string, string>>({
    'Tarawih': 'Tidak Melaksanakan', 'Witir': 'Tidak Melaksanakan',
    'Tahajud': 'Tidak Melaksanakan', 'Duha': 'Tidak Melaksanakan'
  });

  const [sedekahDiri, setSedekahDiri] = useState('');
  const [sedekahRumah, setSedekahRumah] = useState('');
  const [sedekahMasyarakat, setSedekahMasyarakat] = useState('');
  const [belajarMapel, setBelajarMapel] = useState('');
  const [belajarTopik, setBelajarTopik] = useState('');

  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
     // Check existing log
     SupabaseService.getDailyLog(user.id, getTodayDate()).then(data => {
         if (data) {
             setSubmitted(true);
             const d = data.details;
             if(d.puasaStatus) setPuasaStatus(d.puasaStatus as any);
             if(d.isHaid) setIsHaid(d.isHaid);
             if(d.sholatStatus) setSholatStatus(d.sholatStatus);
             if(d.sunahStatus) setSunahStatus(d.sunahStatus);
             // Load others if needed for edit mode (not implemented yet for simplicity)
         }
         setLoading(false);
     });

     // Calculate Ramadan Day
     SupabaseService.getRamadanTarget(user.id).then(target => {
        if(target && target.startDate) {
            const start = new Date(target.startDate);
            const now = new Date();
            start.setHours(0,0,0,0); now.setHours(0,0,0,0);
            const diff = Math.ceil((now.getTime() - start.getTime()) / (86400000));
            setCurrentDay(diff >= 0 ? diff + 1 : 1);
        }
     });
  }, [user.id]);

  const quoteIndex = (currentDay - 1) % RAMADAN_QUOTES.length;
  const currentQuote = RAMADAN_QUOTES[quoteIndex >= 0 ? quoteIndex : 0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const details: DailyLogDetails = {
          puasaStatus, alasanTidakPuasa, isHaid,
          sahurStatus, sahurLokasi, sahurWaktu, bukaStatus,
          sholatStatus, sunahStatus,
          sedekahDiri, sedekahRumah, sedekahMasyarakat,
          belajarMapel, belajarTopik
    };

    const payload: DailyLog = {
        user_id: user.id,
        date: getTodayDate(),
        puasa_type: puasaStatus === 'Penuh' ? 'penuh' : puasaStatus === 'Setengah' ? 'setengah' : 'tidak',
        total_points: 0, // Calculated in service
        details: details
    };
    
    const success = await SupabaseService.saveDailyLog(payload);
    if (success) {
        setSubmitted(true);
        Swal.fire({ icon: 'success', title: 'Alhamdulillah', text: 'Laporan hari ini berhasil disimpan!', confirmButtonColor: '#0ea5e9' });
    } else {
        Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan.', 'error');
    }
  };

  const updateSholat = (p: string, v: string) => setSholatStatus(prev => ({...prev, [p]: v}));
  const updateSunah = (s: string, v: string) => setSunahStatus(prev => ({...prev, [s]: v}));

  if (loading) return <div className="p-10 text-center"><i className="fas fa-circle-notch fa-spin text-primary-500"></i></div>;

  if (submitted) {
     return (
        <div className="p-8 text-center animate-slide-up min-h-[60vh] flex flex-col items-center justify-center">
           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 text-4xl shadow-lg"><i className="fas fa-check"></i></div>
           <h3 className="text-2xl font-black text-slate-800">Laporan Terkirim</h3>
           <p className="text-slate-500 text-sm mt-2">Tetap istikamah ya!</p>
           <button onClick={() => setSubmitted(false)} className="mt-8 px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-full font-bold text-sm shadow-md">Edit Laporan</button>
        </div>
     );
  }

  return (
    <div className="p-6 pb-28 animate-slide-up">
       {/* Spirit Gen-Z Header */}
       <div className="glass-card bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[32px] p-6 text-white mb-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2 opacity-80">
                <i className="fas fa-bolt text-yellow-300"></i>
                <span className="text-xs font-bold tracking-widest uppercase">Spirit Gen-Z • Hari ke-{currentDay}</span>
             </div>
             <p className="text-lg font-bold leading-relaxed">"{currentQuote}"</p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <i className="fas fa-quote-right text-8xl"></i>
          </div>
       </div>

       <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tanggal */}
          <div className="glass-card p-1.5 rounded-[28px]">
             <div className="bg-white/50 rounded-[24px] p-5 border border-white/60">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tanggal</label>
                <input type="date" className="w-full bg-transparent text-lg font-black text-slate-700 outline-none mb-1" defaultValue={getTodayDate()} readOnly />
             </div>
          </div>

          {user.gender === 'P' && (
             <div className="glass-card p-1.5 rounded-[28px]">
                <div className="bg-gradient-to-r from-pink-50 to-white rounded-[24px] p-5 border border-white flex items-center justify-between">
                   <div><h3 className="text-pink-600 font-bold text-sm"><i className="fas fa-venus mr-1"></i> Mode Haid</h3></div>
                   <input type="checkbox" className="w-5 h-5 accent-pink-500" checked={isHaid} onChange={(e) => setIsHaid(e.target.checked)} />
                </div>
             </div>
          )}

          {/* Puasa Section */}
          <div className={`glass-card p-1.5 rounded-[28px] ${isHaid ? 'opacity-50 pointer-events-none' : ''}`}>
             <div className="bg-gradient-to-br from-emerald-50 to-white rounded-[24px] p-6 border border-white/60 space-y-4 shadow-sm relative overflow-hidden">
                 <div className="absolute -right-4 -top-4 text-emerald-100 text-6xl opacity-30"><i className="fas fa-utensils"></i></div>
                 <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-check-circle text-emerald-500"></i> Misi Puasa</h3>
                 
                 <select className="w-full p-4 bg-white border-2 border-emerald-100 rounded-xl text-sm font-bold text-slate-700 outline-none" value={puasaStatus} onChange={(e) => setPuasaStatus(e.target.value as any)}>
                    <option value="Penuh">✅ Puasa Penuh (100 Poin)</option>
                    <option value="Setengah">⚠️ Puasa Setengah Hari (50 Poin)</option>
                    <option value="Tidak">❌ Tidak Puasa (0 Poin)</option>
                 </select>

                 {puasaStatus === 'Tidak' && (
                     <div className="animate-slide-up">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Alasan</label>
                        <select className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-sm font-bold text-red-600 outline-none" value={alasanTidakPuasa} onChange={(e) => setAlasanTidakPuasa(e.target.value)}>
                            <option value="Sakit">Sakit</option>
                            <option value="Bepergian Jauh">Bepergian Jauh</option>
                            <option value="Menstruasi">Menstruasi</option>
                            <option value="Sengaja">Sengaja Membatalkan</option>
                        </select>
                     </div>
                 )}

                 {/* Sahur & Buka */}
                 <div className="grid grid-cols-1 gap-4 pt-4 border-t border-emerald-100">
                    <div>
                        <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-2">Aktivitas Sahur</label>
                        <div className="bg-white/60 p-3 rounded-xl border border-emerald-50">
                            <select className="w-full p-2 bg-transparent text-sm font-bold text-slate-700 border-b border-emerald-100 outline-none mb-3" value={sahurStatus} onChange={(e) => setSahurStatus(e.target.value)}>
                                <option value="Ya">✅ Ya, Saya Sahur</option>
                                <option value="Tidak">❌ Tidak Sahur</option>
                            </select>
                            {sahurStatus === 'Ya' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <select className="w-full p-2 bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-800 outline-none" value={sahurLokasi} onChange={(e) => setSahurLokasi(e.target.value)}>
                                        <option value="Sahur Bersama Keluarga">🏠 Keluarga</option>
                                        <option value="Sahur di Masjid">🕌 Masjid</option>
                                        <option value="Sahur di Musala">🕋 Musala</option>
                                    </select>
                                    <select className="w-full p-2 bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-800 outline-none" value={sahurWaktu} onChange={(e) => setSahurWaktu(e.target.value)}>
                                        <option value="2 Jam sebelum Imsak">🕑 2 Jam Sblm</option>
                                        <option value="1 Jam sebelum Imsak">🕐 1 Jam Sblm</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-2">Aktivitas Buka</label>
                        <div className="bg-white/60 p-3 rounded-xl border border-emerald-50">
                            <select className="w-full p-2 bg-transparent text-sm font-bold text-slate-700 outline-none" value={bukaStatus} onChange={(e) => setBukaStatus(e.target.value)}>
                                <option value="Segera setelah Azan Maghrib">🥣 Segera setelah Azan</option>
                                <option value="Setelah Salat Maghrib">🕌 Setelah Salat Magrib</option>
                            </select>
                        </div>
                    </div>
                 </div>
             </div>
          </div>

          {/* Salat Fardu */}
          <div className={`glass-card p-1.5 rounded-[28px] ${isHaid ? 'opacity-50 pointer-events-none' : ''}`}>
             <div className="bg-gradient-to-br from-sky-50 to-white rounded-[24px] p-6 border border-white/60 space-y-3 shadow-sm relative overflow-hidden">
                 <div className="absolute -right-4 -top-4 text-sky-100 text-6xl opacity-30"><i className="fas fa-mosque"></i></div>
                 <h3 className="font-bold text-sky-800 mb-2 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-pray text-sky-500"></i> Salat 5 Waktu</h3>
                 <div className="grid gap-3">
                     {Object.keys(sholatStatus).map(p => (
                         <div key={p} className="flex items-center justify-between bg-white p-3 rounded-xl border border-sky-100 shadow-sm">
                             <span className="text-xs font-bold text-sky-900 w-16">{p}</span>
                             <select className="bg-sky-50 text-xs font-bold text-sky-700 outline-none py-1.5 px-3 rounded-lg w-full ml-2" value={sholatStatus[p]} onChange={(e) => updateSholat(p, e.target.value)}>
                                 <option value="Lewat">❌ Lewat</option>
                                 <option value="Berjamaah di Masjid">🕌 Jamaah Masjid</option>
                                 <option value="Berjamaah di Rumah">🏠 Jamaah Rumah</option>
                                 <option value="Munfarid">👤 Sendiri</option>
                             </select>
                         </div>
                     ))}
                 </div>
             </div>
          </div>

          {/* Sunah Section */}
          <div className="glass-card p-1.5 rounded-[28px]">
             <div className="bg-gradient-to-br from-amber-50 to-white rounded-[24px] p-6 border border-white/60 shadow-sm relative overflow-hidden">
                 <div className="absolute -right-4 -top-4 text-amber-100 text-6xl opacity-30"><i className="fas fa-star"></i></div>
                 <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-medal text-amber-500"></i> Bonus Pahala</h3>
                 <div className="grid grid-cols-1 gap-3 mb-4">
                     {Object.keys(sunahStatus).map(s => (
                         <div key={s} className="bg-white p-3 rounded-xl flex items-center justify-between border border-amber-100 shadow-sm">
                             <span className="text-xs font-bold text-amber-900 w-24">{s}</span>
                             <select className="bg-amber-50 text-xs font-bold text-amber-700 outline-none py-1.5 px-3 rounded-lg w-full" value={sunahStatus[s]} onChange={(e) => updateSunah(s, e.target.value)}>
                                <option value="Tidak Melaksanakan">⚪ Tidak</option>
                                <option value="Di Masjid">🕌 Masjid</option>
                                <option value="Di Musala">🕋 Musala</option>
                                <option value="Di Rumah">🏠 Rumah</option>
                             </select>
                         </div>
                     ))}
                 </div>
             </div>
          </div>

          {/* Sedekah Section */}
          <div className="glass-card p-1.5 rounded-[28px]">
             <div className="bg-gradient-to-br from-rose-50 to-white rounded-[24px] p-6 border border-white/60 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-rose-800 mb-4 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-hand-holding-heart text-rose-500"></i> Misi Kebaikan</h3>
                 <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-rose-400 uppercase block mb-1">Sedekah Diri (Jujur/Sopan)</label>
                        <input type="text" placeholder="Apa kebaikanmu hari ini?" className="w-full p-3 bg-white border border-rose-100 rounded-xl text-sm outline-none" value={sedekahDiri} onChange={(e) => setSedekahDiri(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-rose-400 uppercase block mb-1">Bantu Orang Tua</label>
                        <input type="text" placeholder="Contoh: Cuci piring" className="w-full p-3 bg-white border border-rose-100 rounded-xl text-sm outline-none" value={sedekahRumah} onChange={(e) => setSedekahRumah(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-rose-400 uppercase block mb-1">Aksi Sosial</label>
                        <input type="text" placeholder="Contoh: Buang sampah pada tempatnya" className="w-full p-3 bg-white border border-rose-100 rounded-xl text-sm outline-none" value={sedekahMasyarakat} onChange={(e) => setSedekahMasyarakat(e.target.value)} />
                    </div>
                 </div>
             </div>
          </div>

          {/* Belajar Section */}
          <div className="glass-card p-1.5 rounded-[28px]">
             <div className="bg-gradient-to-br from-indigo-50 to-white rounded-[24px] p-6 border border-white/60 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-indigo-800 mb-4 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-graduation-cap text-indigo-500"></i> Jurnal Belajar</h3>
                 <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Mapel</label>
                        <input type="text" placeholder="Matematika" className="w-full p-3 bg-white border border-indigo-100 rounded-xl text-sm outline-none font-bold text-indigo-900" value={belajarMapel} onChange={(e) => setBelajarMapel(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Apa yang dipelajari?</label>
                        <textarea rows={2} placeholder="Ringkasan materi..." className="w-full p-3 bg-white border border-indigo-100 rounded-xl text-sm outline-none resize-none" value={belajarTopik} onChange={(e) => setBelajarTopik(e.target.value)} />
                    </div>
                 </div>
             </div>
          </div>

          <button type="submit" className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-lg rounded-[24px] shadow-lg hover:-translate-y-1 transition-all">
             Kirim Laporan
          </button>
       </form>
    </div>
  );
};

// --- Tab Literasi ---
export const TabLiterasi = ({ user }: { user: User }) => {
    const [config, setConfig] = useState<LiterasiConfig | null>(null);
    const [answers, setAnswers] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        const init = async () => {
            const cfg = await SupabaseService.getLiterasiConfig();
            setConfig(cfg);
            setAnswers(new Array(cfg.questions.length).fill(''));
            
            // Check existing
            const log = await SupabaseService.getDailyLog(user.id, getTodayDate());
            if (log?.details.literasiResponse) {
                setSubmitted(true);
            }
        };
        init();
    }, [user.id]);

    // YouTube API Load
    const getYoutubeId = (url: string) => {
        const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        return (match && match[2].length === 11) ? match[2] : null;
    };
    const videoId = config ? getYoutubeId(config.youtubeUrl) : null;

    useEffect(() => {
        if (!videoId || submitted) return;
        const initPlayer = () => {
             // @ts-ignore
             if ((window as any).YT && (window as any).YT.Player) {
                // @ts-ignore
                playerRef.current = new (window as any).YT.Player('youtube-player', {
                    height: '100%', width: '100%', videoId: videoId,
                    playerVars: { 'playsinline': 1, 'controls': 1 },
                });
             }
        };
        if (!(window as any).YT) {
            const tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
            (window as any).onYouTubeIframeAPIReady = initPlayer;
        } else { initPlayer(); }
    }, [videoId, submitted]);

    // Progress Checker
    useEffect(() => {
        const timer = setInterval(() => {
            if (playerRef.current?.getCurrentTime) {
                const cur = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();
                if (dur > 0) {
                    const pct = (cur / dur) * 100;
                    setProgress(pct);
                    if (pct >= 80) setIsUnlocked(true);
                }
            }
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Get existing log first to merge
        const prev = await SupabaseService.getDailyLog(user.id, getTodayDate());
        
        const payload: DailyLog = {
            user_id: user.id,
            date: getTodayDate(),
            puasa_type: prev?.puasa_type || 'tidak',
            total_points: 0,
            details: {
                ...prev?.details,
                literasiResponse: answers
            }
        };
        
        await SupabaseService.saveDailyLog(payload);
        setSubmitted(true);
        Swal.fire('Mantap!', 'Jawaban literasi tersimpan.', 'success');
    };

    if(!config) return <div className="p-10 text-center">Memuat...</div>;
    if(submitted) return <div className="p-8 text-center animate-slide-up"><h3 className="text-2xl font-bold">Literasi Selesai ✅</h3></div>;

    return (
        <div className="p-6 pb-28 animate-slide-up">
            <div className="glass-card rounded-[32px] p-2 mb-6 bg-slate-900 shadow-xl overflow-hidden aspect-video relative">
                 <div id="youtube-player" className="w-full h-full"></div>
            </div>
            
            <div className="mb-6 px-2">
                <div className="flex justify-between text-xs font-bold mb-1"><span>Progress</span><span>{Math.round(progress)}%</span></div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${isUnlocked ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${Math.min(100, progress)}%`}}></div>
                </div>
            </div>

            <div className="glass-card rounded-[32px] p-6 mb-6 bg-white/60 relative">
                {!isUnlocked && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-[32px]"><div className="bg-white p-3 rounded-xl shadow-lg font-bold text-slate-500"><i className="fas fa-lock mr-2"></i>Tonton Video Dulu</div></div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {config.questions.map((q, i) => (
                        <div key={i}>
                            <label className="text-xs font-bold block mb-2">{i+1}. {q}</label>
                            <textarea className="w-full p-3 rounded-xl border border-slate-200" rows={3} value={answers[i]} onChange={e => {
                                const n = [...answers]; n[i] = e.target.value; setAnswers(n);
                            }} required></textarea>
                        </div>
                    ))}
                    <button className="w-full py-3 bg-yellow-500 text-white font-bold rounded-xl shadow-lg">Kirim Jawaban</button>
                </form>
            </div>
        </div>
    );
};

// --- Tab Leaderboard ---
export const TabLeaderboard = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { SupabaseService.getLeaderboard().then(d => { setData(d); setLoading(false); }); }, []);
    return (
        <div className="p-6 pb-28 animate-slide-up">
            <div className="glass-card rounded-[32px] p-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white mb-6 text-center">
                <i className="fas fa-trophy text-3xl mb-2"></i><h2 className="text-xl font-bold">Klasemen</h2>
            </div>
            <div className="glass-card rounded-[24px] p-1">
                {loading ? <div className="p-10 text-center">Memuat...</div> : (
                    <div className="divide-y divide-slate-100">
                        {data.map((item, idx) => (
                            <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-white/40">
                                <div className={`w-8 h-8 flex items-center justify-center font-black rounded-full ${idx < 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</div>
                                <div className="flex-1"><h4 className="font-bold text-slate-800 text-sm">{item.name}</h4><p className="text-[10px] text-slate-500 font-bold uppercase">{item.kelas}</p></div>
                                <div className="font-black text-primary-600 text-sm">{item.points} pts</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Tab Materi (API Aladhan) ---
export const TabMateri = () => {
  const [prayers, setPrayers] = useState<any>(null);
  useEffect(() => {
     fetch('https://api.aladhan.com/v1/timingsByCity?city=Pasuruan&country=Indonesia&method=20')
       .then(res => res.json()).then(data => setPrayers(data.data.timings)).catch(console.error);
  }, []);

  const MATERI_LIST = [
    { title: "Fikih Puasa", icon: "fa-book-quran", color: "text-emerald-600", content: "Syarat Wajib, Rukun, dan Sunnah Puasa..." },
    { title: "Berbakti Ortu", icon: "fa-hands-holding-child", color: "text-blue-600", content: "Ridho Allah ada pada ridho orang tua..." },
    { title: "Zakat Fitrah", icon: "fa-sack-dollar", color: "text-green-600", content: "Wajib bagi setiap muslim, 2.5kg beras..." }
  ];

  return (
    <div className="p-6 pb-28 animate-slide-up">
       <div className="glass-card bg-slate-900 rounded-[32px] p-6 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="relative z-10 text-center">
             <h2 className="text-xl font-bold mb-4">Jadwal Salat Pasuruan</h2>
             {prayers ? (
                <div className="grid grid-cols-5 gap-2 text-center">
                   {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((p, i) => (
                       <div key={p} className="bg-white/10 rounded-xl py-2"><p className="text-[10px] uppercase opacity-70">{['Subuh','Zuhur','Asar','Magrib','Isya'][i]}</p><p className="text-sm font-bold">{prayers[p]}</p></div>
                   ))}
                </div>
             ) : <div className="text-xs">Memuat jadwal...</div>}
          </div>
       </div>
       
       <div className="space-y-3">
           {MATERI_LIST.map((item, idx) => (
               <div key={idx} className="glass-card p-4 rounded-[24px] flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${item.color} shadow-sm`}><i className={`fas ${item.icon}`}></i></div>
                   <div><h3 className="font-bold text-slate-800 text-sm">{item.title}</h3><p className="text-[10px] text-slate-500">Klik untuk membaca</p></div>
               </div>
           ))}
       </div>
    </div>
  );
};

// --- Tab Profile ---
export const TabProfile = ({ user, onLogout }: { user: User, onLogout: () => void }) => (
    <div className="p-6 pb-28 animate-slide-up text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg">{user.name.charAt(0)}</div>
        <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
        <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mt-2 bg-white/50 inline-block px-3 py-1 rounded-full">{user.role} {user.kelas ? `• ${user.kelas}` : ''}</p>
        <button onClick={onLogout} className="w-full p-4 glass-card rounded-[24px] flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 transition mt-8"><i className="fas fa-sign-out-alt"></i> Keluar Aplikasi</button>
    </div>
);