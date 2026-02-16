import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { SupabaseService } from './SupabaseService';
import { User, LiterasiMaterial, DailyLog, DailyLogDetails, RAMADAN_QUOTES } from './types';

const getTodayDate = () => new Date().toISOString().split('T')[0];

// --- Tab Harian ---
export const TabHarian = ({ user }: { user: User }) => {
  const [submitted, setSubmitted] = useState(false);
  
  // State for Form logic - DEFAULT VALUE KOSONG
  const [puasaStatus, setPuasaStatus] = useState<'Penuh' | 'Tidak' | ''>('');
  const [alasanTidakPuasa, setAlasanTidakPuasa] = useState('');
  const [isHaid, setIsHaid] = useState(false);

  const [sahurStatus, setSahurStatus] = useState('');
  const [sahurLokasi, setSahurLokasi] = useState('');
  const [sahurWaktu, setSahurWaktu] = useState('');
  const [bukaStatus, setBukaStatus] = useState('');

  const [sholatStatus, setSholatStatus] = useState<Record<string, string>>({
    'Subuh': '', 'Zuhur': '', 'Asar': '', 'Magrib': '', 'Isya': ''
  });

  const [sunahStatus, setSunahStatus] = useState<Record<string, string>>({
    'Tarawih': '', 'Witir': '',
    'Tahajud': '', 'Duha': ''
  });

  // Tadarus
  const [tadarusStatus, setTadarusStatus] = useState('');
  const [tadarusNote, setTadarusNote] = useState('');

  const [sedekahDiri, setSedekahDiri] = useState('');
  const [sedekahRumah, setSedekahRumah] = useState('');
  const [sedekahMasyarakat, setSedekahMasyarakat] = useState('');
  const [belajarMapel, setBelajarMapel] = useState('');
  const [belajarTopik, setBelajarTopik] = useState('');

  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
     SupabaseService.getDailyLog(user.id, getTodayDate()).then(data => {
         if (data) {
             const d = data.details;
             if(d.puasaStatus) setPuasaStatus(d.puasaStatus as any);
             if(d.isHaid) setIsHaid(d.isHaid);
             if(d.alasanTidakPuasa) setAlasanTidakPuasa(d.alasanTidakPuasa);
             
             if(d.sahurStatus) setSahurStatus(d.sahurStatus);
             if(d.sahurLokasi) setSahurLokasi(d.sahurLokasi);
             if(d.sahurWaktu) setSahurWaktu(d.sahurWaktu);
             if(d.bukaStatus) setBukaStatus(d.bukaStatus);

             if(d.sholatStatus) setSholatStatus(d.sholatStatus);
             if(d.sunahStatus) setSunahStatus(d.sunahStatus);
             
             if(d.tadarusStatus) setTadarusStatus(d.tadarusStatus);
             if(d.tadarusNote) setTadarusNote(d.tadarusNote);

             if(d.sedekahDiri) setSedekahDiri(d.sedekahDiri);
             if(d.sedekahRumah) setSedekahRumah(d.sedekahRumah);
             if(d.sedekahMasyarakat) setSedekahMasyarakat(d.sedekahMasyarakat);
             
             if(d.belajarMapel) setBelajarMapel(d.belajarMapel);
             if(d.belajarTopik) setBelajarTopik(d.belajarTopik);
         }
         setLoading(false);
     });

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

  const handleAction = async (isDraft: boolean) => {
    // VALIDASI: Jika BUKAN draft (Kirim Laporan), cek field wajib
    if (!isDraft) {
        if (puasaStatus === '') return Swal.fire('Belum Lengkap', 'Status Puasa harus dipilih', 'warning');
        if (puasaStatus === 'Tidak' && !alasanTidakPuasa) return Swal.fire('Belum Lengkap', 'Alasan tidak puasa harus dipilih', 'warning');
        if (!isHaid) {
            if (sahurStatus === '') return Swal.fire('Belum Lengkap', 'Status Sahur harus dipilih', 'warning');
            if (bukaStatus === '') return Swal.fire('Belum Lengkap', 'Status Buka Puasa harus dipilih', 'warning');
            const sholatIncomplete = Object.values(sholatStatus).some(v => v === '');
            if (sholatIncomplete) return Swal.fire('Belum Lengkap', 'Semua status Salat Wajib harus dipilih', 'warning');
            if (sahurStatus === 'Ya' && (sahurLokasi === '' || sahurWaktu === '')) return Swal.fire('Belum Lengkap', 'Lokasi & Waktu Sahur harus dipilih', 'warning');
        }
    }

    const details: DailyLogDetails = {
          puasaStatus: puasaStatus as any, 
          alasanTidakPuasa, isHaid,
          sahurStatus, sahurLokasi, sahurWaktu, bukaStatus,
          sholatStatus, sunahStatus,
          tadarusStatus, tadarusNote,
          sedekahDiri, sedekahRumah, sedekahMasyarakat,
          belajarMapel, belajarTopik
    };

    const payload: DailyLog = {
        user_id: user.id,
        date: getTodayDate(),
        puasa_type: puasaStatus === 'Penuh' ? 'penuh' : 'tidak',
        total_points: 0, // Service will calc
        details: details
    };
    
    Swal.fire({ title: 'Menyimpan...', didOpen: () => Swal.showLoading() });
    const success = await SupabaseService.saveDailyLog(payload);
    
    if (success) {
        if (isDraft) {
            Swal.fire({ icon: 'success', title: 'Tersimpan Sementara', text: 'Data telah disimpan. Jangan lupa kirim laporan sebelum hari berakhir.', timer: 2000, showConfirmButton: false });
        } else {
            setSubmitted(true);
            Swal.fire({ icon: 'success', title: 'Alhamdulillah', text: 'Laporan hari ini berhasil dikirim!', confirmButtonColor: '#0ea5e9' });
        }
    } else {
        Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan.', 'error');
    }
  };

  const updateSholat = (p: string, v: string) => setSholatStatus(prev => ({...prev, [p]: v}));
  const updateSunah = (s: string, v: string) => setSunahStatus(prev => ({...prev, [s]: v}));

  // Options untuk Salat & Sunah (Reused)
  const IBADAH_OPTIONS = (
      <>
        <option value="" disabled hidden>----</option>
        <option value="Berjamaah di Masjid">🕌 Jamaah Masjid</option>
        <option value="Berjamaah di Musala">🕋 Jamaah Musala</option>
        <option value="Berjamaah di Rumah">🏠 Jamaah Rumah</option>
        <option value="Munfarid">👤 Sendiri</option>
        <option value="Lewat">❌ Lewat / Tidak</option>
      </>
  );

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

       <div className="space-y-5">
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
                    <option value="" disabled hidden>----</option>
                    <option value="Penuh">✅ Puasa Penuh (100 Poin)</option>
                    <option value="Tidak">❌ Tidak Puasa (0 Poin)</option>
                 </select>

                 {puasaStatus === 'Tidak' && (
                     <div className="animate-slide-up">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Alasan</label>
                        <select className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-sm font-bold text-red-600 outline-none" value={alasanTidakPuasa} onChange={(e) => setAlasanTidakPuasa(e.target.value)}>
                            <option value="" disabled hidden>----</option>
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
                                <option value="" disabled hidden>----</option>
                                <option value="Ya">✅ Ya, Saya Sahur</option>
                                <option value="Tidak">❌ Tidak Sahur</option>
                            </select>
                            {sahurStatus === 'Ya' && (
                                <div className="grid grid-cols-1 gap-2 animate-slide-up">
                                    <select className="w-full p-2 bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-800 outline-none" value={sahurLokasi} onChange={(e) => setSahurLokasi(e.target.value)}>
                                        <option value="" disabled hidden>--Lokasi--</option>
                                        <option value="Sahur Bersama Keluarga">🏠 Sahur Bersama Keluarga</option>
                                        <option value="Sahur di Masjid">🕌 Sahur di Masjid</option>
                                        <option value="Sahur di Musala">🕋 Sahur di Musala</option>
                                    </select>
                                    <select className="w-full p-2 bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-800 outline-none" value={sahurWaktu} onChange={(e) => setSahurWaktu(e.target.value)}>
                                        <option value="" disabled hidden>--Waktu--</option>
                                        <option value="Sahur di Akhir (15 menit sebelum imsak)">🕑 Sahur di Akhir (15 mnt sblm imsak)</option>
                                        <option value="Sahur di Awal">🕐 Sahur di Awal</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-2">Aktivitas Buka</label>
                        <div className="bg-white/60 p-3 rounded-xl border border-emerald-50">
                            <select className="w-full p-2 bg-transparent text-sm font-bold text-slate-700 outline-none" value={bukaStatus} onChange={(e) => setBukaStatus(e.target.value)}>
                                <option value="" disabled hidden>----</option>
                                <option value="Segera setelah Azan Maghrib">🥣 Segera setelah Azan</option>
                                <option value="Setelah Salat Maghrib">🕌 Setelah Salat Magrib</option>
                                <option value="Setelah Salat Tarawih">🌙 Setelah Salat Tarawih</option>
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
                                 {IBADAH_OPTIONS}
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
                                {IBADAH_OPTIONS}
                             </select>
                         </div>
                     ))}
                 </div>
             </div>
          </div>

          {/* Tadarus Section */}
          <div className="glass-card p-1.5 rounded-[28px]">
             <div className="bg-gradient-to-br from-teal-50 to-white rounded-[24px] p-6 border border-white/60 shadow-sm relative overflow-hidden">
                 <h3 className="font-bold text-teal-800 mb-4 flex items-center gap-2 text-lg relative z-10"><i className="fas fa-book-open text-teal-500"></i> Misi Tadarus</h3>
                 <div className="space-y-4">
                    <select className="w-full p-3 bg-white border border-teal-100 rounded-xl text-sm font-bold text-teal-900 outline-none" value={tadarusStatus} onChange={(e) => setTadarusStatus(e.target.value)}>
                        <option value="" disabled hidden>----</option>
                        <option value="Tidak">❌ Tidak Tadarus</option>
                        <option value="Sendiri">👤 Tadarus Sendiri</option>
                        <option value="Bersama">👥 Tadarus Bersama (Keluarga/Masjid)</option>
                    </select>
                    {tadarusStatus && tadarusStatus !== 'Tidak' && (
                        <div className="animate-slide-up">
                            <label className="text-[10px] font-bold text-teal-400 uppercase block mb-1">Surah / Juz / Halaman</label>
                            <input type="text" placeholder="Contoh: QS Al-Mulk atau Juz 1 Hal 5" className="w-full p-3 bg-white border border-teal-100 rounded-xl text-sm outline-none" value={tadarusNote} onChange={(e) => setTadarusNote(e.target.value)} />
                        </div>
                    )}
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

          <div className="space-y-3">
            <button 
                type="button" 
                onClick={() => handleAction(true)} 
                className="w-full py-3 bg-amber-400 text-amber-900 font-bold text-lg rounded-[24px] shadow-lg hover:-translate-y-1 transition-all border-b-4 border-amber-600"
            >
                <i className="fas fa-save mr-2"></i> Simpan Sementara
            </button>
            <button 
                type="button"
                onClick={() => handleAction(false)} 
                className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-lg rounded-[24px] shadow-lg hover:-translate-y-1 transition-all"
            >
                Kirim Laporan
            </button>
          </div>
       </div>
    </div>
  );
};

// --- Tab Literasi ---
export const TabLiterasi = ({ user }: { user: User }) => {
    const [material, setMaterial] = useState<LiterasiMaterial | null>(null);
    const [answers, setAnswers] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const playerRef = useRef<any>(null);
    const lastTimeRef = useRef<number>(0);

    useEffect(() => {
        const init = async () => {
            const today = getTodayDate();
            const mat = await SupabaseService.getLiterasiMaterial(today);
            setMaterial(mat);
            
            if (mat && mat.questions) {
                setAnswers(new Array(mat.questions.length).fill(''));
            }

            const log = await SupabaseService.getDailyLog(user.id, today);
            if (log?.details.literasiResponse) {
                setSubmitted(true);
            }
        };
        init();
    }, [user.id]);

    // Improved Youtube ID Logic
    const getYoutubeId = (url: string) => {
        if(!url) return null;
        // Handle short links (youtu.be), standard links, embed, and v/ format
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    };
    
    const videoId = material ? getYoutubeId(material.youtubeUrl) : null;

    useEffect(() => {
        if (!videoId || submitted) return;
        const initPlayer = () => {
             // @ts-ignore
             if ((window as any).YT && (window as any).YT.Player) {
                // @ts-ignore
                playerRef.current = new (window as any).YT.Player('youtube-player', {
                    height: '100%', width: '100%', videoId: videoId,
                    playerVars: { 
                        'playsinline': 1, 
                        'controls': 0, 
                        'disablekb': 1, 
                        'fs': 0, 
                        'rel': 0,
                        'modestbranding': 1
                    },
                    events: {
                        'onStateChange': (e: any) => {
                            if (e.data === 1) setIsPlaying(true);
                        }
                    }
                });
             }
        };
        if (!(window as any).YT) {
            const tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
            (window as any).onYouTubeIframeAPIReady = initPlayer;
        } else { initPlayer(); }
    }, [videoId, submitted]);

    // Progress Checker & Anti-Skip
    useEffect(() => {
        const timer = setInterval(() => {
            // Check if player is initialized and has methods
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                const cur = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();
                
                if (cur > lastTimeRef.current + 2) {
                    playerRef.current.seekTo(lastTimeRef.current);
                } else {
                    lastTimeRef.current = cur;
                }

                if (dur > 0) {
                    const pct = (cur / dur) * 100;
                    setProgress(pct);
                    if (pct >= 80) setIsUnlocked(true);
                }
            }
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const playVideoManual = () => {
        if(playerRef.current && playerRef.current.playVideo) {
            playerRef.current.playVideo();
            setIsPlaying(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const prev = await SupabaseService.getDailyLog(user.id, getTodayDate());
        const payload: DailyLog = {
            user_id: user.id,
            date: getTodayDate(),
            puasa_type: prev?.puasa_type || 'tidak',
            total_points: 0,
            details: { ...prev?.details, literasiResponse: answers }
        };
        await SupabaseService.saveDailyLog(payload);
        setSubmitted(true);
        Swal.fire('Mantap!', 'Jawaban literasi tersimpan.', 'success');
    };

    if(!material) return <div className="p-10 text-center">Memuat...</div>;
    
    if (!material.youtubeUrl && (!material.questions || material.questions.length === 0)) {
        return (
            <div className="p-10 text-center animate-slide-up flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400 text-3xl"><i className="fas fa-coffee"></i></div>
                <h3 className="text-xl font-bold text-slate-700">Belum Ada Materi</h3>
                <p className="text-slate-500 text-sm mt-2">Materi literasi untuk tanggal {material.date} belum diupload oleh guru.</p>
            </div>
        );
    }

    if(submitted) return <div className="p-8 text-center animate-slide-up"><h3 className="text-2xl font-bold">Literasi Selesai ✅</h3></div>;

    return (
        <div className="p-6 pb-28 animate-slide-up">
            <div className="glass-card rounded-[32px] p-2 mb-4 bg-slate-900 shadow-xl overflow-hidden aspect-video relative group">
                 {videoId ? (
                     <div id="youtube-player" className="w-full h-full"></div>
                 ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center">
                         <i className="fas fa-exclamation-triangle text-3xl mb-2 text-yellow-500"></i>
                         <p>Video tidak valid atau belum diatur.</p>
                     </div>
                 )}
                 <div className="absolute inset-0 z-10 bg-transparent"></div>
            </div>

            {!isPlaying && videoId && (
                <button onClick={playVideoManual} className="w-full py-3 mb-6 bg-red-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-red-700 transition"><i className="fas fa-play"></i> Putar Video</button>
            )}
            
            <div className="mb-6 px-2">
                <div className="flex justify-between text-xs font-bold mb-1"><span>Progress</span><span>{Math.round(progress)}%</span></div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${isUnlocked ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${Math.min(100, progress)}%`}}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-center italic">*Video tidak dapat dipercepat</p>
            </div>

            <div className="glass-card rounded-[32px] p-6 mb-6 bg-white/60 relative">
                {!isUnlocked && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-[32px]"><div className="bg-white p-3 rounded-xl shadow-lg font-bold text-slate-500"><i className="fas fa-lock mr-2"></i>Tonton Video Dulu</div></div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {material.questions.map((q, i) => (
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

// --- Tab Materi (API Aladhan & Content) ---
export const TabMateri = () => {
  const [prayers, setPrayers] = useState<any>(null);
  useEffect(() => {
     fetch('https://api.aladhan.com/v1/timingsByCity?city=Pasuruan&country=Indonesia&method=20')
       .then(res => res.json()).then(data => setPrayers(data.data.timings)).catch(console.error);
  }, []);

  const MATERI_LIST = [
    { title: "Fikih Puasa", icon: "fa-book-quran", color: "text-emerald-600", content: "Puasa secara bahasa berarti menahan. Secara istilah berarti menahan diri dari hal-hal yang membatalkan puasa mulai dari terbit fajar hingga terbenam matahari dengan niat tertentu. \n\nSyarat Wajib: Islam, Baligh, Berakal, Sehat, Mukim. \nRukun: Niat dan Menahan diri." },
    { title: "Berbakti Ortu", icon: "fa-hands-holding-child", color: "text-blue-600", content: "Ridho Allah bergantung pada ridho orang tua, dan murka Allah bergantung pada murka orang tua. Berbuat baik kepada orang tua (Birrul Walidain) adalah amalan utama setelah shalat tepat waktu." },
    { title: "Zakat Fitrah", icon: "fa-sack-dollar", color: "text-green-600", content: "Zakat Fitrah wajib dikeluarkan oleh setiap muslim, laki-laki maupun perempuan, merdeka maupun hamba sahaya. Besarnya adalah 1 sha' (sekitar 2.5kg - 3kg) beras atau makanan pokok. Waktu terbaik membayarnya adalah sebelum shalat Idul Fitri." }
  ];

  const showContent = (item: any) => {
      Swal.fire({
          title: item.title,
          text: item.content,
          icon: 'info',
          confirmButtonColor: '#0ea5e9',
          customClass: { popup: 'rounded-[32px]' }
      });
  };

  return (
    <div className="p-6 pb-28 animate-slide-up">
       <div className="glass-card bg-gradient-to-br from-slate-800 to-slate-900 rounded-[32px] p-6 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="relative z-10">
             <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-xl font-bold">Jadwal Salat</h2>
                    <p className="text-xs text-slate-400"><i className="fas fa-map-marker-alt mr-1"></i> Kab. Pasuruan</p>
                 </div>
                 <i className="fas fa-mosque text-4xl text-slate-700"></i>
             </div>
             
             {prayers ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/5">
                        <p className="text-[10px] uppercase tracking-wider opacity-60">Imsak</p>
                        <p className="text-lg font-black">{prayers.Imsak}</p>
                    </div>
                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-3 shadow-lg border border-white/10">
                         <p className="text-[10px] uppercase tracking-wider opacity-80">Subuh</p>
                         <p className="text-lg font-black">{prayers.Fajr}</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/5">
                         <p className="text-[10px] uppercase tracking-wider opacity-60">Magrib</p>
                         <p className="text-lg font-black">{prayers.Maghrib}</p>
                    </div>
                    <div className="col-span-3 grid grid-cols-4 gap-2 mt-2">
                        {['Dhuhr', 'Asr', 'Isha'].map((p, i) => (
                             <div key={p} className="bg-slate-700/50 rounded-xl py-2">
                                 <p className="text-[9px] uppercase opacity-50">{['Zuhur','Asar','Isya'][i]}</p>
                                 <p className="text-sm font-bold">{prayers[p]}</p>
                             </div>
                        ))}
                         <div className="bg-slate-700/50 rounded-xl py-2">
                             <p className="text-[9px] uppercase opacity-50">Terbit</p>
                             <p className="text-sm font-bold">{prayers.Sunrise}</p>
                         </div>
                    </div>
                </div>
             ) : <div className="text-xs text-center py-4">Sedang memuat jadwal...</div>}
          </div>
       </div>
       
       <div className="space-y-3">
           <h3 className="font-bold text-slate-700 ml-2 mb-2">Materi Keislaman</h3>
           {MATERI_LIST.map((item, idx) => (
               <button key={idx} onClick={() => showContent(item)} className="w-full glass-card p-4 rounded-[24px] flex items-center gap-4 hover:bg-white/60 transition text-left group">
                   <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center ${item.color} shadow-sm group-hover:scale-110 transition`}><i className={`fas ${item.icon} text-lg`}></i></div>
                   <div>
                       <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary-600 transition">{item.title}</h3>
                       <p className="text-[10px] text-slate-500">Ketuk untuk membaca materi</p>
                   </div>
                   <div className="ml-auto text-slate-300"><i className="fas fa-chevron-right"></i></div>
               </button>
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